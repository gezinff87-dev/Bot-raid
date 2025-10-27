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

        // Confirmação EXTRA para comando perigoso
        await interaction.reply({ 
            content: `🚨 **ALERTA CRÍTICO DE DESTRUIÇÃO** 🚨\n\n` +
                    `Você está prestes a **DELETAR ${quantity === 0 ? 'TODOS OS' : quantity} CANAIS**!\n` +
                    `Tipo: ${type}\n\n` +
                    `**⚠️ ISSO É IRREVERSÍVEL ⚠️**\n` +
                    `**🚫 NÃO HÁ VOLTA 🚫**\n\n` +
                    `Digite **/confirmdelete ${quantity} ${type}** para CONFIRMAR esta ação destrutiva.\n` +
                    `Use **/stop** para cancelar.`,
            ephemeral: true 
        });
    }
};
