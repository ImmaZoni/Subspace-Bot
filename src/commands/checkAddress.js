const { SlashCommandBuilder } = require('discord.js');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');

// Define Valid Address Function
const isValidAddress = (address) => {
    return new Promise((resolve) => {
        try {
            encodeAddress(
                isHex(address)
                    ? hexToU8a(address)
                    : decodeAddress(address)
            );
            resolve(true);
        } catch (error) {
            resolve(false);
        }
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-wallet')
        .setDescription('Verifies an address')
        .addStringOption(option =>
            option.setName('address')
                .setDescription('The Address to verify is legitimate')
                .setRequired(true)),
    async execute(interaction) {
        const address = interaction.options.getString('address');

        await interaction.reply({
            content: `Checking Address ${address}`,
            ephemeral: true
        });

        const isValid = await isValidAddress(address);

        if (isValid) {
            await interaction.editReply(`Yes, ${address} is a valid address.`);
        } else {
            await interaction.editReply(`No, ${address} is not a valid address.`);
        }
    },
};
