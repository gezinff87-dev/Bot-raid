const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Para todas as raids e DMs em andamento'),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        // Parar raids de canais
        let raidsStopped = 0;
        for (const [key] of client.raids) {
            if (key.startsWith(interaction.guildId)) {
                client.raids.delete(key);
                raidsStopped++;
            }
        }

        // Parar raids de DMs
        let dmRaidsStopped = 0;
        for (const [key] of client.dmRaids) {
            if (key.startsWith(interaction.guildId)) {
                client.dmRaids.delete(key);
                dmRaidsStopped++;
            }
        }

        await interaction.reply({ 
            content: `🛑 Todas as atividades paradas! Raids: ${raidsStopped}, DMs: ${dmRaidsStopped}`,
            ephemeral: true 
        });
    }
};
