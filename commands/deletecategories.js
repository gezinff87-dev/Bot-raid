const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletecategories')
        .setDescription('Deleta categorias do servidor (ALTAMENTE DESTRUTIVO)')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Número de categorias para deletar (0 = todas)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('deletar_canais')
                .setDescription('Deletar também os canais dentro das categorias?')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('filtro_nome')
                .setDescription('Deletar apenas categorias que contenham este nome')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('vazias_apenas')
                .setDescription('Deletar apenas categorias vazias?')
                .setRequired(false)),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        const quantity = interaction.options.getInteger('quantidade') || 0;
        const deleteChannels = interaction.options.getBoolean('deletar_canais') || false;
        const nameFilter = interaction.options.getString('filtro_nome');
        const emptyOnly = interaction.options.getBoolean('vazias_apenas') || false;
        
        await interaction.reply({ 
            content: `🗑️ Analisando categorias para deleção...`,
            ephemeral: true 
        });

        const channels = await interaction.guild.channels.fetch();
        let categoriesDeleted = 0;
        let channelsDeleted = 0;
        let errors = 0;
        const deletedCategories = [];

        try {
            // Filtrar categorias
            let categories = channels.filter(channel => 
                channel.type === ChannelType.GuildCategory
            );

            // Aplicar filtros
            if (nameFilter) {
                categories = categories.filter(category => 
                    category.name.toLowerCase().includes(nameFilter.toLowerCase())
                );
            }

            if (emptyOnly) {
                categories = categories.filter(category => {
                    const categoryChannels = channels.filter(channel => 
                        channel.parentId === category.id
                    );
                    return categoryChannels.size === 0;
                });
            }

            let processed = 0;
            
            for (const category of categories.values()) {
                if (quantity > 0 && processed >= quantity) break;

                try {
                    const categoryChannels = channels.filter(channel => 
                        channel.parentId === category.id
                    );

                    // Verificar se deve deletar canais primeiro
                    if (deleteChannels && categoryChannels.size > 0) {
                        for (const channel of categoryChannels.values()) {
                            try {
                                await channel.delete();
                                channelsDeleted++;
                                await new Promise(resolve => setTimeout(resolve, 600));
                            } catch (error) {
                                errors++;
                                console.error(`Erro ao deletar canal ${channel.name}:`, error);
                            }
                        }
                    }

                    // Deletar a categoria
                    await category.delete();
                    categoriesDeleted++;
                    deletedCategories.push(category.name);
                    processed++;

                    // Delay progressivo
                    const delay = 800 + (Math.random() * 400);
                    await new Promise(resolve => setTimeout(resolve, delay));

                } catch (error) {
                    errors++;
                    console.error(`Erro ao deletar categoria ${category.name}:`, error);
                    
                    if (error.code === 429) {
                        const retryAfter = error.retryAfter || 15;
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    }
                }
            }

            let resultMessage = `💀 **DELEÇÃO EM MASSA CONCLUÍDA!**\n\n` +
                               `📁 **Categorias deletadas:** ${categoriesDeleted}\n` +
                               `🗑️ **Canais deletados:** ${channelsDeleted}\n` +
                               `❌ **Erros:** ${errors}\n\n` +
                               `⚙️ **Configuração:**\n` +
                               `• Filtro de nome: ${nameFilter || 'Nenhum'}\n` +
                               `• Apenas vazias: ${emptyOnly ? '✅' : '❌'}\n` +
                               `• Deletar canais: ${deleteChannels ? '✅' : '❌'}`;

            if (categoriesDeleted > 0) {
                resultMessage += `\n\n📋 **Categorias removidas:**\n${deletedCategories.slice(0, 8).map(name => `▸ ${name}`).join('\n')}`;
                if (categoriesDeleted > 8) {
                    resultMessage += `\n▸ ... e mais ${categoriesDeleted - 8} categorias`;
                }
            } else {
                resultMessage += `\n\n⚠️ Nenhuma categoria foi deletada (filtros muito restritivos?)`;
            }

            await interaction.followUp({ 
                content: resultMessage,
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro no deletecategories:', error);
            await interaction.followUp({ 
                content: `💥 FALHA NA DELEÇÃO!\n` +
                        `Categorias: ${categoriesDeleted}\n` +
                        `Canais: ${channelsDeleted}\n` +
                        `Erros: ${errors}\n` +
                        `Erro: ${error.message}`,
                ephemeral: true 
            });
        }
    }
};
