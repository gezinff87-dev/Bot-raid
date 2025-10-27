const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Gerencia cargos do servidor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Cria múltiplos cargos de uma vez')
                .addIntegerOption(option =>
                    option.setName('quantidade')
                        .setDescription('Quantidade de cargos para criar')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(50))
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('Nome base para os cargos')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('cor')
                        .setDescription('Cor dos cargos (hexadecimal)')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('mentionable')
                        .setDescription('Cargos mencionáveis?')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('hoist')
                        .setDescription('Cargos separados na lista?')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deleta cargos do servidor')
                .addIntegerOption(option =>
                    option.setName('quantidade')
                        .setDescription('Número de cargos para deletar (0 = todos)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('filtro_nome')
                        .setDescription('Deletar apenas cargos que contenham este nome')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('sem_membros')
                        .setDescription('Deletar apenas cargos sem membros?')
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
            await handleCreateRoles(interaction);
        } else if (subcommand === 'delete') {
            await handleDeleteRoles(interaction);
        }
    }
};

async function handleCreateRoles(interaction) {
    const quantity = interaction.options.getInteger('quantidade');
    const baseName = interaction.options.getString('nome');
    const color = interaction.options.getString('cor') || '#99aab5';
    const mentionable = interaction.options.getBoolean('mentionable') || false;
    const hoist = interaction.options.getBoolean('hoist') || false;

    await interaction.reply({ 
        content: `🎨 Criando ${quantity} cargos "${baseName}"...`,
        ephemeral: true 
    });

    let created = 0;
    let errors = 0;
    const createdRoles = [];

    try {
        for (let i = 1; i <= quantity; i++) {
            try {
                let roleName;
                if (quantity === 1) {
                    roleName = baseName;
                } else {
                    roleName = `${baseName}-${i}`;
                }

                const role = await interaction.guild.roles.create({
                    name: roleName,
                    color: color,
                    mentionable: mentionable,
                    hoist: hoist,
                    reason: `Criado por ${interaction.user.tag}`
                });

                created++;
                createdRoles.push(role.name);

                // Delay para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 800));

            } catch (error) {
                errors++;
                console.error(`Erro ao criar cargo ${i}:`, error);
                
                if (error.code === 429) {
                    const retryAfter = error.retryAfter || 10;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                }
            }
        }

        let resultMessage = `✅ **CRIAÇÃO DE CARGOS CONCLUÍDA!**\n` +
                           `🎨 Cargos criados: ${created}\n` +
                           `❌ Erros: ${errors}\n` +
                           `🏷️ Nome base: "${baseName}"\n` +
                           `🎯 Mencionáveis: ${mentionable ? '✅' : '❌'}\n` +
                           `📊 Separados: ${hoist ? '✅' : '❌'}`;

        if (created > 0) {
            resultMessage += `\n\n📋 **Cargos criados:**\n${createdRoles.slice(0, 8).map(name => `• ${name}`).join('\n')}`;
            if (created > 8) {
                resultMessage += `\n• ... e mais ${created - 8} cargos`;
            }
        }

        await interaction.followUp({ 
            content: resultMessage,
            ephemeral: true 
        });

    } catch (error) {
        console.error('Erro na criação de cargos:', error);
        await interaction.followUp({ 
            content: `❌ Erro na criação! Criados: ${created}, Erros: ${errors}`,
            ephemeral: true 
        });
    }
}

async function handleDeleteRoles(interaction) {
    const quantity = interaction.options.getInteger('quantidade') || 0;
    const nameFilter = interaction.options.getString('filtro_nome');
    const noMembersOnly = interaction.options.getBoolean('sem_membros') || false;

    await interaction.reply({ 
        content: `🗑️ Analisando cargos para deleção...`,
        ephemeral: true 
    });

    const roles = await interaction.guild.roles.fetch();
    let deleted = 0;
    let errors = 0;
    const deletedRoles = [];

    try {
        // Filtrar cargos (excluir @everyone e cargos do bot)
        let rolesToDelete = roles.filter(role => 
            !role.managed && 
            role.id !== interaction.guild.id &&
            !role.name.includes('@') &&
            role.editable
        );

        // Aplicar filtros
        if (nameFilter) {
            rolesToDelete = rolesToDelete.filter(role => 
                role.name.toLowerCase().includes(nameFilter.toLowerCase())
            );
        }

        if (noMembersOnly) {
            rolesToDelete = rolesToDelete.filter(role => role.members.size === 0);
        }

        let processed = 0;
        
        for (const role of rolesToDelete.values()) {
            if (quantity > 0 && processed >= quantity) break;

            try {
                await role.delete(`Deletado por ${interaction.user.tag}`);
                deleted++;
                deletedRoles.push(role.name);
                processed++;

                // Delay para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 600));

            } catch (error) {
                errors++;
                console.error(`Erro ao deletar cargo ${role.name}:`, error);
                
                if (error.code === 429) {
                    const retryAfter = error.retryAfter || 10;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                }
            }
        }

        let resultMessage = `🗑️ **DELEÇÃO DE CARGOS CONCLUÍDA!**\n` +
                           `✅ Cargos deletados: ${deleted}\n` +
                           `❌ Erros: ${errors}`;

        if (nameFilter) {
            resultMessage += `\n🔍 Filtro: "${nameFilter}"`;
        }
        if (noMembersOnly) {
            resultMessage += `\n👥 Apenas sem membros: ✅`;
        }

        if (deleted > 0) {
            resultMessage += `\n\n📋 **Cargos deletados:**\n${deletedRoles.slice(0, 6).map(name => `• ${name}`).join('\n')}`;
            if (deleted > 6) {
                resultMessage += `\n• ... e mais ${deleted - 6} cargos`;
            }
        } else {
            resultMessage += `\n\n⚠️ Nenhum cargo foi deletado (filtros muito restritivos?)`;
        }

        await interaction.followUp({ 
            content: resultMessage,
            ephemeral: true 
        });

    } catch (error) {
        console.error('Erro na deleção de cargos:', error);
        await interaction.followUp({ 
            content: `❌ Erro na deleção! Deletados: ${deleted}, Erros: ${errors}`,
            ephemeral: true 
        });
    }
}
