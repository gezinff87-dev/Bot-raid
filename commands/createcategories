const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createcategories')
        .setDescription('Cria múltiplas categorias com total personalização')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de categorias para criar')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome base para as categorias')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('canais_automaticos')
                .setDescription('Criar canais dentro das categorias automaticamente?')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('canais_texto')
                .setDescription('Quantidade de canais de texto por categoria')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(20))
        .addIntegerOption(option =>
            option.setName('canais_voz')
                .setDescription('Quantidade de canais de voz por categoria')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(20))
        .addStringOption(option =>
            option.setName('nome_canais_texto')
                .setDescription('Nome base para canais de texto')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('nome_canais_voz')
                .setDescription('Nome base para canais de voz')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('nsfw')
                .setDescription('Canais de texto como NSFW?')
                .setRequired(false)),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        const quantity = interaction.options.getInteger('quantidade');
        const baseName = interaction.options.getString('nome');
        const autoChannels = interaction.options.getBoolean('canais_automaticos') || false;
        const textChannels = interaction.options.getInteger('canais_texto') || 2;
        const voiceChannels = interaction.options.getInteger('canais_voz') || 1;
        const textChannelName = interaction.options.getString('nome_canais_texto') || 'chat';
        const voiceChannelName = interaction.options.getString('nome_canais_voz') || 'voz';
        const nsfw = interaction.options.getBoolean('nsfw') || false;

        await interaction.reply({ 
            content: `📁 Criando ${quantity} categorias com configurações personalizadas...`,
            ephemeral: true 
        });

        let categoriesCreated = 0;
        let textChannelsCreated = 0;
        let voiceChannelsCreated = 0;
        let errors = 0;
        const createdCategories = [];

        try {
            for (let i = 1; i <= quantity; i++) {
                try {
                    // Gerar nome único para categoria
                    let categoryName;
                    const patterns = [
                        `${baseName}-${i}`,
                        `${baseName}-${String.fromCharCode(64 + i)}`,
                        `${baseName}-0${i}`,
                        `${baseName}-${Math.floor(Math.random() * 1000)}`
                    ];
                    categoryName = patterns[i % patterns.length];

                    // Criar a categoria
                    const category = await interaction.guild.channels.create({
                        name: categoryName,
                        type: ChannelType.GuildCategory
                    });

                    categoriesCreated++;
                    createdCategories.push(category.name);

                    // Criar canais automáticos dentro da categoria
                    if (autoChannels) {
                        // Criar canais de texto
                        for (let j = 1; j <= textChannels; j++) {
                            try {
                                await interaction.guild.channels.create({
                                    name: `${textChannelName}-${j}`,
                                    type: ChannelType.GuildText,
                                    parent: category.id,
                                    nsfw: nsfw,
                                    topic: `Canal ${j} da categoria ${categoryName}`
                                });
                                textChannelsCreated++;
                                await new Promise(resolve => setTimeout(resolve, 600));
                            } catch (error) {
                                errors++;
                            }
                        }

                        // Criar canais de voz
                        for (let k = 1; k <= voiceChannels; k++) {
                            try {
                                await interaction.guild.channels.create({
                                    name: `${voiceChannelName}-${k}`,
                                    type: ChannelType.GuildVoice,
                                    parent: category.id,
                                    userLimit: 0 // Sem limite de usuários
                                });
                                voiceChannelsCreated++;
                                await new Promise(resolve => setTimeout(resolve, 600));
                            } catch (error) {
                                errors++;
                            }
                        }
                    }

                    // Delay progressivo
                    const delay = 1000 + (Math.random() * 1000);
                    await new Promise(resolve => setTimeout(resolve, delay));

                } catch (error) {
                    errors++;
                    console.error(`Erro ao criar categoria ${i}:`, error);
                    
                    if (error.code === 429) {
                        const retryAfter = error.retryAfter || 15;
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    }
                }
            }

            let resultMessage = `🎉 **CRIAÇÃO EM MASSA CONCLUÍDA!**\n\n` +
                               `📁 **Categorias:** ${categoriesCreated}\n` +
                               `💬 **Canais de texto:** ${textChannelsCreated}\n` +
                               `🎤 **Canais de voz:** ${voiceChannelsCreated}\n` +
                               `❌ **Erros:** ${errors}\n\n` +
                               `⚙️ **Configuração:**\n` +
                               `• Nome base: "${baseName}"\n` +
                               `• Canais automáticos: ${autoChannels ? '✅' : '❌'}\n` +
                               `• NSFW: ${nsfw ? '✅' : '❌'}`;

            if (categoriesCreated > 0) {
                resultMessage += `\n\n📋 **Primeiras categorias:**\n${createdCategories.slice(0, 5).map(name => `▸ ${name}`).join('\n')}`;
                if (categoriesCreated > 5) {
                    resultMessage += `\n▸ ... e mais ${categoriesCreated - 5} categorias`;
                }
            }

            await interaction.followUp({ 
                content: resultMessage,
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro no createcategories:', error);
            await interaction.followUp({ 
                content: `💥 FALHA NA CRIAÇÃO!\n` +
                        `Categorias: ${categoriesCreated}\n` +
                        `Canais de texto: ${textChannelsCreated}\n` +
                        `Canais de voz: ${voiceChannelsCreated}\n` +
                        `Erros: ${errors}`,
                ephemeral: true 
            });
        }
    }
};
