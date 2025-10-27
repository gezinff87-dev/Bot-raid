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
