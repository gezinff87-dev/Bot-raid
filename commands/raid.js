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
    
    async execute(interaction, client) {
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
        const times = interaction.options.getInteger('vezes') || 50;

        const raidId = `${interaction.guildId}-${channel.id}`;
        client.raids.set(raidId, true);

        let sent = 0;
        let errors = 0;

        for (let i = 0; i < times && client.raids.get(raidId); i++) {
            try {
                await channel.send(message);
                sent++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                errors++;
                console.error('Erro ao enviar mensagem:', error);
            }
        }

        client.raids.delete(raidId);

        await interaction.followUp({ 
            content: `✅ Raid ${client.raids.get(raidId) ? 'interrompida' : 'concluída'}! Mensagens: ${sent}, Erros: ${errors}`, 
            ephemeral: true 
        });
    }
};
