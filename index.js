const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();
client.raids = new Map();
client.dmRaids = new Map();
client.massOperations = new Map(); // Novo: para controlar operações em massa

// Carregar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Eventos
client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'Erro ao executar o comando!', 
            ephemeral: true 
        });
    }
});

// Comandos
const commands = [
    {
        name: 'raid',
        description: 'Inicia uma raid no servidor',
        options: [
            {
                name: 'canal',
                type: 7,
                description: 'Canal para a raid',
                required: true
            },
            {
                name: 'mensagem',
                type: 3,
                description: 'Mensagem para spammar',
                required: true
            },
            {
                name: 'vezes',
                type: 4,
                description: 'Número de mensagens',
                required: false
            }
        ]
    },
    {
        name: 'massdm',
        description: 'Envia DM para todos os membros',
        options: [
            {
                name: 'mensagem',
                type: 3,
                description: 'Mensagem para enviar',
                required: true
            }
        ]
    },
    {
        name: 'stop',
        description: 'Para todas as raids e operações em andamento'
    },
    {
        name: 'chaos',
        description: 'Cria caos no servidor (CUIDADO!)',
        options: [
            {
                name: 'novo_nome',
                type: 3,
                description: 'Novo nome para os canais',
                required: true
            },
            {
                name: 'misturar',
                type: 5,
                description: 'Misturar tipos de canais?',
                required: false
            }
        ]
    },
    {
        name: 'deletechannels',
        description: 'Deleta canais do servidor (EXTREMAMENTE PERIGOSO)',
        options: [
            {
                name: 'quantidade',
                type: 4,
                description: 'Número de canais para deletar (0 = todos)',
                required: false
            },
            {
                name: 'tipo',
                type: 3,
                description: 'Tipo de canal para deletar',
                required: false,
                choices: [
                    { name: 'Todos os canais', value: 'all' },
                    { name: 'Apenas textuais', value: 'text' },
                    { name: 'Apenas de voz', value: 'voice' },
                    { name: 'Apenas categorias', value: 'category' }
                ]
            }
        ]
    },
    {
        name: 'deletecategories',
        description: 'Deleta categorias do servidor (ALTAMENTE DESTRUTIVO)',
        options: [
            {
                name: 'quantidade',
                type: 4,
                description: 'Número de categorias para deletar (0 = todas)',
                required: false
            },
            {
                name: 'deletar_canais',
                type: 5,
                description: 'Deletar também os canais dentro das categorias?',
                required: false
            },
            {
                name: 'filtro_nome',
                type: 3,
                description: 'Deletar apenas categorias que contenham este nome',
                required: false
            },
            {
                name: 'vazias_apenas',
                type: 5,
                description: 'Deletar apenas categorias vazias?',
                required: false
            }
        ]
    },
    {
        name: 'createchannels',
        description: 'Cria múltiplos canais de uma vez',
        options: [
            {
                name: 'quantidade',
                type: 4,
                description: 'Quantidade de canais para criar',
                required: true,
                min_value: 1,
                max_value: 100
            },
            {
                name: 'nome',
                type: 3,
                description: 'Nome base para os canais',
                required: true
            },
            {
                name: 'tipo',
                type: 3,
                description: 'Tipo de canal para criar',
                required: false,
                choices: [
                    { name: 'Texto', value: 'text' },
                    { name: 'Voz', value: 'voice' },
                    { name: 'Categoria', value: 'category' }
                ]
            },
            {
                name: 'categoria',
                type: 7,
                description: 'Categoria para colocar os canais',
                required: false
            },
            {
                name: 'nsfw',
                type: 5,
                description: 'Canais NSFW?',
                required: false
            },
            {
                name: 'topico',
                type: 3,
                description: 'Tópico para os canais de texto',
                required: false
            }
        ]
    },
    {
        name: 'createcategories',
        description: 'Cria múltiplas categorias de uma vez',
        options: [
            {
                name: 'quantidade',
                type: 4,
                description: 'Quantidade de categorias para criar',
                required: true,
                min_value: 1,
                max_value: 100
            },
            {
                name: 'nome',
                type: 3,
                description: 'Nome base para as categorias',
                required: true
            },
            {
                name: 'canais_automaticos',
                type: 5,
                description: 'Criar canais dentro das categorias automaticamente?',
                required: false
            },
            {
                name: 'canais_texto',
                type: 4,
                description: 'Quantidade de canais de texto por categoria',
                required: false,
                min_value: 0,
                max_value: 20
            },
            {
                name: 'canais_voz',
                type: 4,
                description: 'Quantidade de canais de voz por categoria',
                required: false,
                min_value: 0,
                max_value: 20
            },
            {
                name: 'nome_canais_texto',
                type: 3,
                description: 'Nome base para canais de texto',
                required: false
            },
            {
                name: 'nome_canais_voz',
                type: 3,
                description: 'Nome base para canais de voz',
                required: false
            },
            {
                name: 'nsfw',
                type: 5,
                description: 'Canais de texto como NSFW?',
                required: false
            }
        ]
    },
    {
        name: 'roles',
        description: 'Gerencia cargos do servidor',
        options: [
            {
                name: 'create',
                type: 1,
                description: 'Cria múltiplos cargos de uma vez',
                options: [
                    {
                        name: 'quantidade',
                        type: 4,
                        description: 'Quantidade de cargos para criar',
                        required: true,
                        min_value: 1,
                        max_value: 50
                    },
                    {
                        name: 'nome',
                        type: 3,
                        description: 'Nome base para os cargos',
                        required: true
                    },
                    {
                        name: 'cor',
                        type: 3,
                        description: 'Cor dos cargos (hexadecimal)',
                        required: false
                    },
                    {
                        name: 'mentionable',
                        type: 5,
                        description: 'Cargos mencionáveis?',
                        required: false
                    },
                    {
                        name: 'hoist',
                        type: 5,
                        description: 'Cargos separados na lista?',
                        required: false
                    }
                ]
            },
            {
                name: 'delete',
                type: 1,
                description: 'Deleta cargos do servidor',
                options: [
                    {
                        name: 'quantidade',
                        type: 4,
                        description: 'Número de cargos para deletar (0 = todos)',
                        required: false
                    },
                    {
                        name: 'filtro_nome',
                        type: 3,
                        description: 'Deletar apenas cargos que contenham este nome',
                        required: false
                    },
                    {
                        name: 'sem_membros',
                        type: 5,
                        description: 'Deletar apenas cargos sem membros?',
                        required: false
                    }
                ]
            }
        ]
    },
    {
        name: 'emojis',
        description: 'Gerencia emojis do servidor',
        options: [
            {
                name: 'create',
                type: 1,
                description: 'Cria múltiplos emojis de uma vez',
                options: [
                    {
                        name: 'quantidade',
                        type: 4,
                        description: 'Quantidade de emojis para criar',
                        required: true,
                        min_value: 1,
                        max_value: 50
                    },
                    {
                        name: 'nome',
                        type: 3,
                        description: 'Nome base para os emojis',
                        required: true
                    },
                    {
                        name: 'url',
                        type: 3,
                        description: 'URL da imagem para o emoji',
                        required: false
                    }
                ]
            },
            {
                name: 'delete',
                type: 1,
                description: 'Deleta emojis do servidor',
                options: [
                    {
                        name: 'quantidade',
                        type: 4,
                        description: 'Número de emojis para deletar (0 = todos)',
                        required: false
                    },
                    {
                        name: 'filtro_nome',
                        type: 3,
                        description: 'Deletar apenas emojis que contenham este nome',
                        required: false
                    },
                    {
                        name: 'animados_apenas',
                        type: 5,
                        description: 'Deletar apenas emojis animados?',
                        required: false
                    }
                ]
            }
        ]
    },
    {
        name: 'moderation',
        description: 'Gerencia membros do servidor (banir/expulsar)',
        options: [
            {
                name: 'ban',
                type: 1,
                description: 'Bane múltiplos membros do servidor',
                options: [
                    {
                        name: 'quantidade',
                        type: 4,
                        description: 'Quantidade de membros para banir',
                        required: true,
                        min_value: 1,
                        max_value: 100
                    },
                    {
                        name: 'motivo',
                        type: 3,
                        description: 'Motivo do banimento',
                        required: false
                    },
                    {
                        name: 'apenas_bots',
                        type: 5,
                        description: 'Banir apenas bots?',
                        required: false
                    },
                    {
                        name: 'apenas_offline',
                        type: 5,
                        description: 'Banir apenas membros offline?',
                        required: false
                    },
                    {
                        name: 'dias_mensagens',
                        type: 4,
                        description: 'Número de dias de mensagens para deletar (0-7)',
                        required: false,
                        min_value: 0,
                        max_value: 7
                    }
                ]
            },
            {
                name: 'kick',
                type: 1,
                description: 'Expulsa múltiplos membros do servidor',
                options: [
                    {
                        name: 'quantidade',
                        type: 4,
                        description: 'Quantidade de membros para expulsar',
                        required: true,
                        min_value: 1,
                        max_value: 100
                    },
                    {
                        name: 'motivo',
                        type: 3,
                        description: 'Motivo da expulsão',
                        required: false
                    },
                    {
                        name: 'apenas_bots',
                        type: 5,
                        description: 'Expulsar apenas bots?',
                        required: false
                    },
                    {
                        name: 'apenas_offline',
                        type: 5,
                        description: 'Expulsar apenas membros offline?',
                        required: false
                    }
                ]
            }
        ]
    },
    {
        name: 'mod',
        description: 'Ações de moderação rápidas',
        options: [
            {
                name: 'ban',
                type: 1,
                description: 'Bane um membro específico',
                options: [
                    {
                        name: 'membro',
                        type: 6,
                        description: 'Membro para banir',
                        required: true
                    },
                    {
                        name: 'motivo',
                        type: 3,
                        description: 'Motivo do banimento',
                        required: false
                    }
                ]
            },
            {
                name: 'kick',
                type: 1,
                description: 'Expulsa um membro específico',
                options: [
                    {
                        name: 'membro',
                        type: 6,
                        description: 'Membro para expulsar',
                        required: true
                    },
                    {
                        name: 'motivo',
                        type: 3,
                        description: 'Motivo da expulsão',
                        required: false
                    }
                ]
            },
            {
                name: 'massban',
                type: 1,
                description: 'Bane múltiplos membros de uma vez',
                options: [
                    {
                        name: 'ids',
                        type: 3,
                        description: 'IDs dos membros para banir (separados por vírgula)',
                        required: true
                    },
                    {
                        name: 'motivo',
                        type: 3,
                        description: 'Motivo do banimento',
                        required: false
                    }
                ]
            },
            {
                name: 'masskick',
                type: 1,
                description: 'Expulsa múltiplos membros de uma vez',
                options: [
                    {
                        name: 'ids',
                        type: 3,
                        description: 'IDs dos membros para expulsar (separados por vírgula)',
                        required: true
                    },
                    {
                        name: 'motivo',
                        type: 3,
                        description: 'Motivo da expulsão',
                        required: false
                    }
                ]
            },
            {
                name: 'unban',
                type: 1,
                description: 'Desbane um usuário',
                options: [
                    {
                        name: 'user_id',
                        type: 3,
                        description: 'ID do usuário para desbanir',
                        required: true
                    },
                    {
                        name: 'motivo',
                        type: 3,
                        description: 'Motivo do desbanimento',
                        required: false
                    }
                ]
            }
        ]
    }
];

// Registrar comandos
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('📝 Registrando comandos...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Comandos registrados!');
    } catch (error) {
        console.error(error);
    }
})();

client.login(process.env.TOKEN);
