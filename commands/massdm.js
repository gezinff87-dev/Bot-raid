const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massdm')
        .setDescription('Envia DM para todos os membros')
        .addStringOption(option =>
            option.setName('mensagem')
                .setDescription('Mensagem para enviar')
                .setRequired(true)),
    
    async execute(interaction) {
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

        let success = 0;
        let failed = 0;

        for (const member of members.values()) {
            if (member.user.bot) continue;
            
            try {
                await member.send(message);
                success++;
                // Delay para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                failed++;
                console.error(`Erro ao enviar DM para ${member.user.tag}:`, error);
            }
        }

        await interaction.followUp({ 
            content: `✅ DMs enviadas! Sucesso: ${success}, Falhas: ${failed}`, 
            ephemeral: true 
        });
    }
};
