const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Para todas as raids e operações em andamento'),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ 
                content: '❌ Você precisa de permissão de administrador!', 
                ephemeral: true 
            });
        }

        let stoppedOperations = [];

        // 1. Parar raids de canais
        let raidsStopped = 0;
        for (const [key] of client.raids) {
            if (key.startsWith(interaction.guildId)) {
                client.raids.delete(key);
                raidsStopped++;
            }
        }
        if (raidsStopped > 0) {
            stoppedOperations.push(`🔴 Raids de canais: ${raidsStopped}`);
        }

        // 2. Parar raids de DMs
        let dmRaidsStopped = 0;
        for (const [key] of client.dmRaids) {
            if (key.startsWith(interaction.guildId)) {
                client.dmRaids.delete(key);
                dmRaidsStopped++;
            }
        }
        if (dmRaidsStopped > 0) {
            stoppedOperations.push(`📨 Raids de DMs: ${dmRaidsStopped}`);
        }

        // 3. Parar operações em massa (moderação, criação, deleção)
        let massOpsStopped = 0;
        for (const [key] of client.massOperations) {
            if (key.startsWith(interaction.guildId)) {
                client.massOperations.delete(key);
                massOpsStopped++;
            }
        }
        if (massOpsStopped > 0) {
            stoppedOperations.push(`⚡ Operações em massa: ${massOpsStopped}`);
        }

        // 4. Parar operações de moderação específicas
        let modOpsStopped = 0;
        // Adicione aqui lógicas específicas para parar banimentos/expulsões em massa
        // se você implementar controle individual para elas

        const totalStopped = raidsStopped + dmRaidsStopped + massOpsStopped + modOpsStopped;

        if (totalStopped === 0) {
            await interaction.reply({ 
                content: `ℹ️ **Nenhuma operação ativa para parar.**\n\nNão há raids, DMs em massa ou operações de moderação em andamento.`,
                ephemeral: true 
            });
        } else {
            let resultMessage = `🛑 **TODAS AS OPERAÇÕES PARADAS!**\n\n` +
                              `📊 **Operações interrompidas:**\n` +
                              `${stoppedOperations.join('\n')}\n\n` +
                              `✅ **Total:** ${totalStopped} operações paradas\n\n` +
                              `⚡ *Comandos afetados:*\n` +
                              `• /raid\n• /massdm\n• /moderation\n• /mod massban\n• /mod masskick\n• Operações em massa de canais/cargos/emojis`;

            await interaction.reply({ 
                content: resultMessage,
                ephemeral: true 
            });
        }

        // Log para debug
        console.log(`[STOP] Servidor ${interaction.guildId} - Operações paradas:`, {
            raids: raidsStopped,
            dms: dmRaidsStopped,
            massOps: massOpsStopped,
            modOps: modOpsStopped
        });
    }
};
