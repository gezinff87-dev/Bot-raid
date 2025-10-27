const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletechannels')
        .setDescription('Deleta canais do servidor (EXTREMAMENTE PERIGOSO)')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Número de canais para deletar (0 = todos)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de canal para deletar')
                .setRequired(false)
                .addChoices(
                    { name: 'Todos os canais', value: 'all' },
                    { name: 'Apenas textuais', value: 'text' },
                    { name: 'Apenas de voz', value: 'voice' },
                    { name: 'Apenas categorias', value: 'category' }
                )),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        const quantity = interaction.options.getInteger('quantidade') || 0;
        const type = interaction.options.getString('tipo') || 'all';
        
        await interaction.reply({ 
            content: `🗑️ Iniciando deleção de ${quantity === 0 ? 'TODOS OS' : quantity} canais (${type})...`,
            ephemeral: true 
        });

        const channels = await interaction.guild.channels.fetch();
        let deleted = 0;
        let errors = 0;

        try {
            for (const channel of channels.values()) {
                if (deleted >= quantity && quantity !== 0) break;

                // Filtrar por tipo
                let shouldDelete = false;
                switch (type) {
                    case 'all':
                        shouldDelete = true;
                        break;
                    case 'text':
                        shouldDelete = channel.type === ChannelType.GuildText;
                        break;
                    case 'voice':
                        shouldDelete = channel.type === ChannelType.GuildVoice;
                        break;
                    case 'category':
                        shouldDelete = channel.type === ChannelType.GuildCategory;
                        break;
                }

                if (shouldDelete) {
                    try {
                        await channel.delete();
                        deleted++;
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
                    } catch (error) {
                        errors++;
                        console.error(`Erro ao deletar canal ${channel.name}:`, error);
                    }
                }
            }

            await interaction.followUp({ 
                content: `✅ Deleção concluída! Canais deletados: ${deleted}, Erros: ${errors}`,
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro no deletechannels:', error);
            await interaction.followUp({ 
                content: `❌ Erro durante a deleção! Deletados: ${deleted}, Erros: ${errors}`,
                ephemeral: true 
            });
        }
    }
};
