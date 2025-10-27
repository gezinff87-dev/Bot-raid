const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

client.commands = new Collection();
client.raids = new Map();
client.dmRaids = new Map();

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
        description: 'Para todas as raids e DMs em andamento'
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
