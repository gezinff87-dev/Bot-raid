const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojis')
        .setDescription('Gerencia emojis do servidor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Cria múltiplos emojis de uma vez')
                .addIntegerOption(option =>
                    option.setName('quantidade')
                        .setDescription('Quantidade de emojis para criar')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(50))
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('Nome base para os emojis')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('URL da imagem para o emoji')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deleta emojis do servidor')
                .addIntegerOption(option =>
                    option.setName('quantidade')
                        .setDescription('Número de emojis para deletar (0 = todos)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('filtro_nome')
                        .setDescription('Deletar apenas emojis que contenham este nome')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('animados_apenas')
                        .setDescription('Deletar apenas emojis animados?')
                        .setRequired(false))),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            await handleCreateEmojis(interaction);
        } else if (subcommand === 'delete') {
            await handleDeleteEmojis(interaction);
        }
    }
};

async function handleCreateEmojis(interaction) {
    const quantity = interaction.options.getInteger('quantidade');
    const baseName = interaction.options.getString('nome');
    const imageUrl = interaction.options.getString('url') || 'https://cdn.discordapp.com/emojis/1069628343358631986.png';

    await interaction.reply({ 
        content: `🖼️ Criando ${quantity} emojis "${baseName}"...`,
        ephemeral: true 
    });

    let created = 0;
    let errors = 0;
    const createdEmojis = [];

    try {
        // Baixar a imagem
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        for (let i = 1; i <= quantity; i++) {
            try {
                let emojiName;
                if (quantity === 1) {
                    emojiName = baseName;
                } else {
                    emojiName = `${baseName}_${i}`;
                }

                const emoji = await interaction.guild.emojis.create({
                    attachment: imageBuffer,
                    name: emojiName,
                    reason: `Criado por ${interaction.user.tag}`
                });

                created++;
                createdEmojis.push(emoji.toString());

                // Delay para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (error) {
                errors++;
                console.error(`Erro ao criar emoji ${i}:`, error);
                
                if (error.code === 429) {
                    const retryAfter = error.retryAfter || 15;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                }
            }
        }

        let resultMessage = `✅ **CRIAÇÃO DE EMOJIS CONCLUÍDA!**\n` +
                           `🖼️ Emojis criados: ${created}\n` +
                           `❌ Erros: ${errors}\n` +
                           `🏷️ Nome base: "${baseName}"`;

        if (created > 0) {
            resultMessage += `\n\n📋 **Emojis criados:**\n${createdEmojis.slice(0, 6).join(' ')}`;
            if (created > 6) {
                resultMessage += `\n... e mais ${created - 6} emojis`;
            }
        }

        await interaction.followUp({ 
            content: resultMessage,
            ephemeral: true 
        });

    } catch (error) {
        console.error('Erro na criação de emojis:', error);
        await interaction.followUp({ 
            content: `❌ Erro na criação! Criados: ${created}, Erros: ${errors}`,
            ephemeral: true 
        });
    }
}

async function handleDeleteEmojis(interaction) {
    const quantity = interaction.options.getInteger('quantidade') || 0;
    const nameFilter = interaction.options.getString('filtro_nome');
    const animatedOnly = interaction.options.getBoolean('animados_apenas') || false;

    await interaction.reply({ 
        content: `🗑️ Analisando emojis para deleção...`,
        ephemeral: true 
    });

    const emojis = await interaction.guild.emojis.fetch();
    let deleted = 0;
    let errors = 0;
    const deletedEmojis = [];

    try {
        // Filtrar emojis
        let emojisToDelete = emojis.filter(emoji => emoji.managed === false);

        // Aplicar filtros
        if (nameFilter) {
            emojisToDelete = emojisToDelete.filter(emoji => 
                emoji.name.toLowerCase().includes(nameFilter.toLowerCase())
            );
        }

        if (animatedOnly) {
            emojisToDelete = emojisToDelete.filter(emoji => emoji.animated);
        }

        let processed = 0;
        
        for (const emoji of emojisToDelete.values()) {
            if (quantity > 0 && processed >= quantity) break;

            try {
                await emoji.delete(`Deletado por ${interaction.user.tag}`);
                deleted++;
                deletedEmojis.push(emoji.toString());
                processed++;

                // Delay para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 800));

            } catch (error) {
                errors++;
                console.error(`Erro ao deletar emoji ${emoji.name}:`, error);
                
                if (error.code === 429) {
                    const retryAfter = error.retryAfter || 10;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                }
            }
        }

        let resultMessage = `🗑️ **DELEÇÃO DE EMOJIS CONCLUÍDA!**\n` +
                           `✅ Emojis deletados: ${deleted}\n` +
                           `❌ Erros: ${errors}`;

        if (nameFilter) {
            resultMessage += `\n🔍 Filtro: "${nameFilter}"`;
        }
        if (animatedOnly) {
            resultMessage += `\n🎞️ Apenas animados: ✅`;
        }

        if (deleted > 0) {
            resultMessage += `\n\n📋 **Emojis deletados:**\n${deletedEmojis.slice(0, 8).join(' ')}`;
            if (deleted > 8) {
                resultMessage += `\n... e mais ${deleted - 8} emojis`;
            }
        } else {
            resultMessage += `\n\n⚠️ Nenhum emoji foi deletado (filtros muito restritivos?)`;
        }

        await interaction.followUp({ 
            content: resultMessage,
            ephemeral: true 
        });

    } catch (error) {
        console.error('Erro na deleção de emojis:', error);
        await interaction.followUp({ 
            content: `❌ Erro na deleção! Deletados: ${deleted}, Erros: ${errors}`,
            ephemeral: true 
        });
    }
      }
