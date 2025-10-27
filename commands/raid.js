const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Inicia uma raid no servidor')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal para a raid')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mensagem')
                .setDescription('Mensagem para spammar')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('vezes')
                .setDescription('Número de mensagens')
                .setRequired(false)),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: '⚡ Iniciando raid...', 
            ephemeral: true 
        });

        const channel = interaction.options.getChannel('canal');
        const message = interaction.options.getString('mensagem');
        const times = interaction.options.getInteger('vezes') || 10;

        for (let i = 0; i < times; i++) {
            try {
                await channel.send(message);
                // Delay para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        }

        await interaction.followUp({ 
            content: `✅ Raid concluída! ${times} mensagens enviadas.`, 
            ephemeral: true 
        });
    }
};
