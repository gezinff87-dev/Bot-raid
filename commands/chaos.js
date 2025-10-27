const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chaos')
        .setDescription('Cria caos no servidor (CUIDADO!)')
        .addStringOption(option =>
            option.setName('novo_nome')
                .setDescription('Novo nome para os canais')
                .setRequired(true)),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: '💥 Iniciando caos no servidor...', 
            ephemeral: true 
        });

        const newName = interaction.options.getString('novo_nome');
        const channels = await interaction.guild.channels.fetch();

        let renamed = 0;
        let deleted = 0;
        let errors = 0;

        try {
            // Renomear canais
            for (const channel of channels.values()) {
                try {
                    if (channel.type === ChannelType.GuildText) {
                        await channel.setName(`${newName}-${Math.floor(Math.random() * 1000)}`);
                        renamed++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    errors++;
                    console.error(`Erro ao renomear canal ${channel.name}:`, error);
                }
            }

        } catch (error) {
            console.error('Erro no comando chaos:', error);
        }

        await interaction.followUp({ 
            content: `💀 Caos concluído! Canais renomeados: ${renamed}, Erros: ${errors}`,
            ephemeral: true 
        });
    }
};
