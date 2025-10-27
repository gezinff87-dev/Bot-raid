const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createchannels')
        .setDescription('Cria múltiplos canais de uma vez')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de canais para criar')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome base para os canais')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de canal para criar')
                .setRequired(false)
                .addChoices(
                    { name: 'Texto', value: 'text' },
                    { name: 'Voz', value: 'voice' },
                    { name: 'Categoria', value: 'category' }
                ))
        .addChannelOption(option =>
            option.setName('categoria')
                .setDescription('Categoria para colocar os canais')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('nsfw')
                .setDescription('Canais NSFW?')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('topico')
                .setDescription('Tópico para os canais de texto')
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
        const channelType = interaction.options.getString('tipo') || 'text';
        const category = interaction.options.getChannel('categoria');
        const nsfw = interaction.options.getBoolean('nsfw') || false;
        const topic = interaction.options.getString('topico');

        await interaction.reply({ 
            content: `📝 Criando ${quantity} canais do tipo ${channelType}...`,
            ephemeral: true 
        });

        let created = 0;
        let errors = 0;
        const createdChannels = [];

        try {
            for (let i = 1; i <= quantity; i++) {
                try {
                    let channelName;
                    
                    // Gerar nomes únicos e criativos
                    if (quantity === 1) {
                        channelName = baseName;
                    } else {
                        const randomSuffix = Math.floor(Math.random() * 1000);
                        channelName = `${baseName}-${i}`;
                        
                        // Alternar padrões de nome
                        const patterns = [
                            `${baseName}-${i}`,
                            `${baseName}-${randomSuffix}`,
                            `${baseName}-${String.fromCharCode(65 + (i % 26))}${i}`
                        ];
                        channelName = patterns[i % patterns.length];
                    }

                    // Configurações do canal
                    let discordChannelType;
                    let channelOptions = {
                        name: channelName,
                        nsfw: nsfw
                    };

                    switch (channelType) {
                        case 'text':
                            discordChannelType = ChannelType.GuildText;
                            if (topic) channelOptions.topic = `${topic} - Canal ${i}`;
                            break;
                        case 'voice':
                            discordChannelType = ChannelType.GuildVoice;
                            channelOptions.userLimit = 0; // Sem limite
                            break;
                        case 'category':
                            discordChannelType = ChannelType.GuildCategory;
                            break;
                        default:
                            discordChannelType = ChannelType.GuildText;
                    }

                    // Adicionar categoria se especificada e não for categoria
                    if (discordChannelType !== ChannelType.GuildCategory && category) {
                        channelOptions.parent = category.id;
                    }

                    const channel = await interaction.guild.channels.create({
                        type: discordChannelType,
                        ...channelOptions
                    });

                    created++;
                    createdChannels.push(channel.name);

                    // Delay progressivo para evitar detection
                    const delay = 800 + (Math.random() * 700);
                    await new Promise(resolve => setTimeout(resolve, delay));

                } catch (error) {
                    errors++;
                    console.error(`Erro ao criar canal ${i}:`, error);
                    
                    if (error.code === 429) {
                        const retryAfter = error.retryAfter || 10;
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    }
                }
            }

            let resultMessage = `🎉 **CRIAÇÃO CONCLUÍDA!**\n` +
                               `✅ Canais criados: ${created}\n` +
                               `❌ Erros: ${errors}\n` +
                               `📊 Tipo: ${channelType}\n` +
                               `🏷️ Nome base: "${baseName}"`;

            if (created > 0) {
                resultMessage += `\n\n📋 **Primeiros canais:**\n${createdChannels.slice(0, 8).map(name => `• ${name}`).join('\n')}`;
                if (created > 8) {
                    resultMessage += `\n• ... e mais ${created - 8} canais`;
                }
            }

            await interaction.followUp({ 
                content: resultMessage,
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro no createchannels:', error);
            await interaction.followUp({ 
                content: `💥 ERRO CRÍTICO!\nCriados: ${created}, Erros: ${errors}\nErro: ${error.message}`,
                ephemeral: true 
            });
        }
    }
};
