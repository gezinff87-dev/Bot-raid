const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Ações de moderação rápidas')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Bane um membro específico')
                .addUserOption(option =>
                    option.setName('membro')
                        .setDescription('Membro para banir')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('motivo')
                        .setDescription('Motivo do banimento')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Expulsa um membro específico')
                .addUserOption(option =>
                    option.setName('membro')
                        .setDescription('Membro para expulsar')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('motivo')
                        .setDescription('Motivo da expulsão')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('massban')
                .setDescription('Bane múltiplos membros de uma vez')
                .addStringOption(option =>
                    option.setName('ids')
                        .setDescription('IDs dos membros para banir (separados por vírgula)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('motivo')
                        .setDescription('Motivo do banimento')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('masskick')
                .setDescription('Expulsa múltiplos membros de uma vez')
                .addStringOption(option =>
                    option.setName('ids')
                        .setDescription('IDs dos membros para expulsar (separados por vírgula)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('motivo')
                        .setDescription('Motivo da expulsão')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Desbane um usuário')
                .addStringOption(option =>
                    option.setName('user_id')
                        .setDescription('ID do usuário para desbanir')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('motivo')
                        .setDescription('Motivo do desbanimento')
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
            await handleSingleBan(interaction);
        } else if (subcommand === 'kick') {
            await handleSingleKick(interaction);
        } else if (subcommand === 'massban') {
            await handleMassBanByIds(interaction);
        } else if (subcommand === 'masskick') {
            await handleMassKickByIds(interaction);
        } else if (subcommand === 'unban') {
            await handleUnban(interaction);
        }
    }
};

async function handleSingleBan(interaction) {
    const member = interaction.options.getMember('membro');
    const reason = interaction.options.getString('motivo') || `Banido por ${interaction.user.tag}`;

    if (!member) {
        return await interaction.reply({ 
            content: '❌ Membro não encontrado!', 
            ephemeral: true 
        });
    }

    if (!member.bannable) {
        return await interaction.reply({ 
            content: '❌ Não posso banir este membro!', 
            ephemeral: true 
        });
    }

    try {
        await member.ban({ reason: reason });
        await interaction.reply({ 
            content: `✅ **BANIDO!**\n👤 ${member.user.tag}\n📝 **Motivo:** ${reason}`,
            ephemeral: true 
        });
    } catch (error) {
        console.error('Erro ao banir:', error);
        await interaction.reply({ 
            content: '❌ Erro ao banir o membro!', 
            ephemeral: true 
        });
    }
}

async function handleSingleKick(interaction) {
    const member = interaction.options.getMember('membro');
    const reason = interaction.options.getString('motivo') || `Expulso por ${interaction.user.tag}`;

    if (!member) {
        return await interaction.reply({ 
            content: '❌ Membro não encontrado!', 
            ephemeral: true 
        });
    }

    if (!member.kickable) {
        return await interaction.reply({ 
            content: '❌ Não posso expulsar este membro!', 
            ephemeral: true 
        });
    }

    try {
        await member.kick(reason);
        await interaction.reply({ 
            content: `✅ **EXPULSO!**\n👤 ${member.user.tag}\n📝 **Motivo:** ${reason}`,
            ephemeral: true 
        });
    } catch (error) {
        console.error('Erro ao expulsar:', error);
        await interaction.reply({ 
            content: '❌ Erro ao expulsar o membro!', 
            ephemeral: true 
        });
    }
}

async function handleMassBanByIds(interaction) {
    const idsString = interaction.options.getString('ids');
    const reason = interaction.options.getString('motivo') || `Banido em massa por ${interaction.user.tag}`;
    
    const ids = idsString.split(',').map(id => id.trim()).filter(id => id.length > 0);

    if (ids.length > 50) {
        return await interaction.reply({ 
            content: '❌ Máximo de 50 IDs por vez!', 
            ephemeral: true 
        });
    }

    await interaction.reply({ 
        content: `🔨 Banindo ${ids.length} membros...`,
        ephemeral: true 
    });

    let banned = 0;
    let errors = 0;
    const results = [];

    for (const id of ids) {
        try {
            // Tentar buscar o membro primeiro
            const member = await interaction.guild.members.fetch(id).catch(() => null);
            
            if (member) {
                if (member.bannable) {
                    await member.ban({ reason: reason });
                    banned++;
                    results.push(`✅ ${member.user.tag}`);
                } else {
                    errors++;
                    results.push(`❌ ${member.user.tag} - Não banível`);
                }
            } else {
                // Tentar banir por ID mesmo se não estiver no servidor
                await interaction.guild.members.ban(id, { reason: reason });
                banned++;
                results.push(`✅ ID: ${id} (usuário não estava no servidor)`);
            }

            await new Promise(resolve => setTimeout(resolve, 800));

        } catch (error) {
            errors++;
            results.push(`❌ ID: ${id} - ${error.message}`);
            console.error(`Erro ao banir ${id}:`, error);
        }
    }

    let resultMessage = `🔨 **BANIMENTO EM MASSA CONCLUÍDO!**\n\n` +
                       `✅ Banidos: ${banned}\n` +
                       `❌ Erros: ${errors}\n` +
                       `📝 Motivo: "${reason}"\n\n` +
                       `📋 **Resultados:**\n${results.slice(0, 10).join('\n')}`;

    if (results.length > 10) {
        resultMessage += `\n... e mais ${results.length - 10} resultados`;
    }

    await interaction.followUp({ 
        content: resultMessage,
        ephemeral: true 
    });
}

async function handleMassKickByIds(interaction) {
    const idsString = interaction.options.getString('ids');
    const reason = interaction.options.getString('motivo') || `Expulso em massa por ${interaction.user.tag}`;
    
    const ids = idsString.split(',').map(id => id.trim()).filter(id => id.length > 0);

    if (ids.length > 50) {
        return await interaction.reply({ 
            content: '❌ Máximo de 50 IDs por vez!', 
            ephemeral: true 
        });
    }

    await interaction.reply({ 
        content: `👢 Expulsando ${ids.length} membros...`,
        ephemeral: true 
    });

    let kicked = 0;
    let errors = 0;
    const results = [];

    for (const id of ids) {
        try {
            const member = await interaction.guild.members.fetch(id).catch(() => null);
            
            if (member && member.kickable) {
                await member.kick(reason);
                kicked++;
                results.push(`✅ ${member.user.tag}`);
            } else if (member) {
                errors++;
                results.push(`❌ ${member.user.tag} - Não expulsável`);
            } else {
                errors++;
                results.push(`❌ ID: ${id} - Membro não encontrado`);
            }

            await new Promise(resolve => setTimeout(resolve, 800));

        } catch (error) {
            errors++;
            results.push(`❌ ID: ${id} - ${error.message}`);
            console.error(`Erro ao expulsar ${id}:`, error);
        }
    }

    let resultMessage = `👢 **EXPULSÃO EM MASSA CONCLUÍDA!**\n\n` +
                       `✅ Expulsos: ${kicked}\n` +
                       `❌ Erros: ${errors}\n` +
                       `📝 Motivo: "${reason}"\n\n` +
                       `📋 **Resultados:**\n${results.slice(0, 10).join('\n')}`;

    if (results.length > 10) {
        resultMessage += `\n... e mais ${results.length - 10} resultados`;
    }

    await interaction.followUp({ 
        content: resultMessage,
        ephemeral: true 
    });
}

async function handleUnban(interaction) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('motivo') || `Desbanido por ${interaction.user.tag}`;

    try {
        await interaction.guild.members.unban(userId, reason);
        await interaction.reply({ 
            content: `✅ **DESBANIDO!**\n👤 ID: ${userId}\n📝 **Motivo:** ${reason}`,
            ephemeral: true 
        });
    } catch (error) {
        console.error('Erro ao desbanir:', error);
        await interaction.reply({ 
            content: '❌ Erro ao desbanir! Verifique se o ID está correto.', 
            ephemeral: true 
        });
    }
                                      }
