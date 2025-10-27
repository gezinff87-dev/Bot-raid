const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderation')
        .setDescription('Gerencia membros do servidor (banir/expulsar)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Bane múltiplos membros do servidor')
                .addIntegerOption(option =>
                    option.setName('quantidade')
                        .setDescription('Quantidade de membros para banir')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100))
                .addStringOption(option =>
                    option.setName('motivo')
                        .setDescription('Motivo do banimento')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('apenas_bots')
                        .setDescription('Banir apenas bots?')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('apenas_offline')
                        .setDescription('Banir apenas membros offline?')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('dias_mensagens')
                        .setDescription('Número de dias de mensagens para deletar (0-7)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(7)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Expulsa múltiplos membros do servidor')
                .addIntegerOption(option =>
                    option.setName('quantidade')
                        .setDescription('Quantidade de membros para expulsar')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100))
                .addStringOption(option =>
                    option.setName('motivo')
                        .setDescription('Motivo da expulsão')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('apenas_bots')
                        .setDescription('Expulsar apenas bots?')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('apenas_offline')
                        .setDescription('Expulsar apenas membros offline?')
                        .setRequired(false))),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'ban') {
            await handleBanMembers(interaction);
        } else if (subcommand === 'kick') {
            await handleKickMembers(interaction);
        }
    }
};

async function handleBanMembers(interaction) {
    const quantity = interaction.options.getInteger('quantidade');
    const reason = interaction.options.getString('motivo') || `Banido por ${interaction.user.tag}`;
    const botsOnly = interaction.options.getBoolean('apenas_bots') || false;
    const offlineOnly = interaction.options.getBoolean('apenas_offline') || false;
    const deleteDays = interaction.options.getInteger('dias_mensagens') || 0;

    await interaction.reply({ 
        content: `🔨 Iniciando banimento em massa de ${quantity} membros...`,
        ephemeral: true 
    });

    const members = await interaction.guild.members.fetch();
    let banned = 0;
    let errors = 0;
    const bannedMembers = [];

    try {
        // Filtrar membros
        let membersToBan = members.filter(member => 
            !member.user.bot && // Não banir bots por padrão
            member.bannable &&
            member.id !== interaction.user.id &&
            member.id !== client.user.id
        );

        // Aplicar filtros
        if (botsOnly) {
            membersToBan = members.filter(member => 
                member.user.bot && 
                member.bannable &&
                member.id !== client.user.id
            );
        }

        if (offlineOnly) {
            membersToBan = membersToBan.filter(member => 
                member.presence?.status === 'offline' || !member.presence
            );
        }

        // Converter para array e embaralhar
        let membersArray = Array.from(membersToBan.values());
        
        // Embaralhar a ordem
        for (let i = membersArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [membersArray[i], membersArray[j]] = [membersArray[j], membersArray[i]];
        }

        let processed = 0;
        
        for (const member of membersArray) {
            if (processed >= quantity) break;

            try {
                await member.ban({ 
                    reason: reason,
                    deleteMessageDays: deleteDays 
                });
                
                banned++;
                bannedMembers.push(member.user.tag);
                processed++;

                // Delay para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 1200));

            } catch (error) {
                errors++;
                console.error(`Erro ao banir ${member.user.tag}:`, error);
                
                if (error.code === 429) {
                    const retryAfter = error.retryAfter || 15;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                }
            }
        }

        let resultMessage = `🔨 **BANIMENTO EM MASSA CONCLUÍDO!**\n\n` +
                           `✅ Membros banidos: ${banned}\n` +
                           `❌ Erros: ${errors}\n` +
                           `📝 Motivo: "${reason}"\n` +
                           `🗑️ Mensagens deletadas: ${deleteDays} dias\n\n` +
                           `⚙️ **Filtros:**\n` +
                           `• Apenas bots: ${botsOnly ? '✅' : '❌'}\n` +
                           `• Apenas offline: ${offlineOnly ? '✅' : '❌'}`;

        if (banned > 0) {
            resultMessage += `\n\n📋 **Membros banidos:**\n${bannedMembers.slice(0, 8).map(name => `• ${name}`).join('\n')}`;
            if (banned > 8) {
                resultMessage += `\n• ... e mais ${banned - 8} membros`;
            }
        }

        await interaction.followUp({ 
            content: resultMessage,
            ephemeral: true 
        });

    } catch (error) {
        console.error('Erro no banimento em massa:', error);
        await interaction.followUp({ 
            content: `❌ Erro no banimento! Banidos: ${banned}, Erros: ${errors}`,
            ephemeral: true 
        });
    }
}

async function handleKickMembers(interaction) {
    const quantity = interaction.options.getInteger('quantidade');
    const reason = interaction.options.getString('motivo') || `Expulso por ${interaction.user.tag}`;
    const botsOnly = interaction.options.getBoolean('apenas_bots') || false;
    const offlineOnly = interaction.options.getBoolean('apenas_offline') || false;

    await interaction.reply({ 
        content: `👢 Iniciando expulsão em massa de ${quantity} membros...`,
        ephemeral: true 
    });

    const members = await interaction.guild.members.fetch();
    let kicked = 0;
    let errors = 0;
    const kickedMembers = [];

    try {
        // Filtrar membros
        let membersToKick = members.filter(member => 
            !member.user.bot && // Não expulsar bots por padrão
            member.kickable &&
            member.id !== interaction.user.id &&
            member.id !== client.user.id
        );

        // Aplicar filtros
        if (botsOnly) {
            membersToKick = members.filter(member => 
                member.user.bot && 
                member.kickable &&
                member.id !== client.user.id
            );
        }

        if (offlineOnly) {
            membersToKick = membersToKick.filter(member => 
                member.presence?.status === 'offline' || !member.presence
            );
        }

        // Converter para array e embaralhar
        let membersArray = Array.from(membersToKick.values());
        
        // Embaralhar a ordem
        for (let i = membersArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [membersArray[i], membersArray[j]] = [membersArray[j], membersArray[i]];
        }

        let processed = 0;
        
        for (const member of membersArray) {
            if (processed >= quantity) break;

            try {
                await member.kick(reason);
                
                kicked++;
                kickedMembers.push(member.user.tag);
                processed++;

                // Delay para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                errors++;
                console.error(`Erro ao expulsar ${member.user.tag}:`, error);
                
                if (error.code === 429) {
                    const retryAfter = error.retryAfter || 15;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                }
            }
        }

        let resultMessage = `👢 **EXPULSÃO EM MASSA CONCLUÍDA!**\n\n` +
                           `✅ Membros expulsos: ${kicked}\n` +
                           `❌ Erros: ${errors}\n` +
                           `📝 Motivo: "${reason}"\n\n` +
                           `⚙️ **Filtros:**\n` +
                           `• Apenas bots: ${botsOnly ? '✅' : '❌'}\n` +
                           `• Apenas offline: ${offlineOnly ? '✅' : '❌'}`;

        if (kicked > 0) {
            resultMessage += `\n\n📋 **Membros expulsos:**\n${kickedMembers.slice(0, 8).map(name => `• ${name}`).join('\n')}`;
            if (kicked > 8) {
                resultMessage += `\n• ... e mais ${kicked - 8} membros`;
            }
        }

        await interaction.followUp({ 
            content: resultMessage,
            ephemeral: true 
        });

    } catch (error) {
        console.error('Erro na expulsão em massa:', error);
        await interaction.followUp({ 
            content: `❌ Erro na expulsão! Expulsos: ${kicked}, Erros: ${errors}`,
            ephemeral: true 
        });
    }
          }
