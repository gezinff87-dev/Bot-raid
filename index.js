const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

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
        await command.execute(interaction);
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
