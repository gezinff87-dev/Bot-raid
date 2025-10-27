const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chaos')
        .setDescription('Cria caos no servidor (CUIDADO!)')
        .addStringOption(option =>
            option.setName('novo_nome')
                .setDescription('Nome base para os canais')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('misturar')
                .setDescription('Misturar tipos de canais?')
                .setRequired(false)),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: '💥 Iniciando caos total no servidor...', 
            ephemeral: true 
        });

        const baseName = interaction.options.getString('novo_nome');
        const mixTypes = interaction.options.getBoolean('misturar') || false;
        const channels = await interaction.guild.channels.fetch();

        let renamed = 0;
        let errors = 0;
        const usedNames = new Set();

        // Lista de emojis e palavras para mais caos
        const emojis = ['💀', '🔥', '⚡', '🎯', '🚨', '💥', '👻', '🤖', '👾', '🐉'];
        const chaosWords = ['DESTRUIDO', 'HACKEADO', 'CAOS', 'RAID', 'ANARQUIA', 'GLITCH'];

        try {
            const channelArray = Array.from(channels.values());
            
            // Embaralhar a ordem dos canais
            for (let i = channelArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [channelArray[i], channelArray[j]] = [channelArray[j], channelArray[i]];
            }

            for (const channel of channelArray) {
                try {
                    if (channel.type === ChannelType.GuildText || 
                        channel.type === ChannelType.GuildVoice || 
                        channel.type === ChannelType.GuildCategory) {
                        
                        let newChannelName;
                        let attempts = 0;
                        
                        do {
                            // Gerar nome caótico único
                            const randomNum = Math.floor(Math.random() * 10000);
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            const randomWord = chaosWords[Math.floor(Math.random() * chaosWords.length)];
                            
                            if (mixTypes) {
                                // Modo caos total - nomes misturados
                                const patterns = [
                                    `${randomEmoji}${baseName}-${randomNum}`,
                                    `${randomWord}-${baseName}-${randomNum}`,
                                    `${baseName}-${randomWord}-${randomNum}`,
                                    `${randomEmoji}${randomWord}-${randomNum}`
                                ];
                                newChannelName = patterns[Math.floor(Math.random() * patterns.length)];
                            } else {
                                // Modo normal - apenas com números únicos
                                newChannelName = `${baseName}-${randomNum}`;
                            }
                            
                            attempts++;
                        } while (usedNames.has(newChannelName) && attempts < 20);

                        if (attempts >= 20) {
                            console.log(`Não consegui nome único para ${channel.name}`);
                            continue;
                        }

                        usedNames.add(newChannelName);
                        await channel.setName(newChannelName);
                        renamed++;
                        
                        // Delay variável para evitar detection
                        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                    }
                } catch (error) {
                    errors++;
                    console.error(`Erro ao renomear canal ${channel.name}:`, error);
                    
                    // Se for erro de rate limit, esperar mais
                    if (error.code === 429) {
                        const retryAfter = error.retryAfter || 5;
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    }
                }
            }

        } catch (error) {
            console.error('Erro no comando chaos:', error);
        }

        await interaction.followUp({ 
            content: `💀 CAOS CONCLUÍDO! Canais renomeados: ${renamed}, Erros: ${errors}`,
            ephemeral: true 
        });
    }
};
