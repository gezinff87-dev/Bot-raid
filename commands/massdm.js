const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massdm')
        .setDescription('Envia DM para todos os membros')
        .addStringOption(option =>
            option.setName('mensagem')
                .setDescription('Mensagem para enviar')
                .setRequired(true)),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: '📤 Iniciando envio de DMs...', 
            ephemeral: true 
        });

        const message = interaction.options.getString('mensagem');
        const members = await interaction.guild.members.fetch();
        const dmRaidId = `${interaction.guildId}-dms`;

        client.dmRaids.set(dmRaidId, true);

        let success = 0;
        let failed = 0;

        for (const member of members.values()) {
            if (!client.dmRaids.get(dmRaidId)) break;
            if (member.user.bot) continue;
            
            try {
                await member.send(message);
                success++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                failed++;
                console.error(`Erro ao enviar DM para ${member.user.tag}:`, error);
            }
        }

        client.dmRaids.delete(dmRaidId);

        await interaction.followUp({ 
            content: `✅ DMs ${client.dmRaids.get(dmRaidId) ? 'interrompidas' : 'concluídas'}! Sucesso: ${success}, Falhas: ${failed}`, 
            ephemeral: true 
        });
    }
};
