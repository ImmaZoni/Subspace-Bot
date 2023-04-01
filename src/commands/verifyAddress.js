const { ActionRowBuilder, ModalBuilder, SlashCommandBuilder, TextInputStyle, TextInputBuilder } = require('discord.js');
const { hexToU8a, isHex } = require('@polkadot/util');
const { cryptoWaitReady, decodeAddress, encodeAddress, signatureVerify } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');

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

// Define Valid Signature Function
const isValidSignature = (signedMessage, userSignature, userAddress) => {
    const publicKey = decodeAddress(userAddress);
    const hexPublicKey = u8aToHex(publicKey);
  
    return signatureVerify(signedMessage, userSignature, hexPublicKey).isValid;
  };
  

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link-wallet')
        .setDescription('links an address to your Discord account')
        .addStringOption(option =>
            option.setName('chain')
                .setDescription('Specify which network you are verifying for')
                .setRequired(false)),
    async execute(interaction) {


        //Capture Username and build into proper layout
        if(!interaction.guild) return; // Edge Case to ensure user has a guild.
        const guild = interaction.guild.id;
        const user = interaction.user;
        const username = user.username + "#" + user.discriminator;
        
        //Define Inputs and Information type
        const inputs = {
            usernameInput: new TextInputBuilder()
                .setCustomId('modalUsername')
                .setLabel('Your Username')
                .setStyle(TextInputStyle.Short)
                .setValue(username)
                .setRequired(true),
            addressInput: new TextInputBuilder()
                .setCustomId('modalAddress')
                .setLabel('Your Address')
                .setStyle(TextInputStyle.Short)
                .setRequired(true),
            signatureInput: new TextInputBuilder()
                .setCustomId('modalSignature')
                .setLabel('Signature Provided from signature')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        }
        
        //Build Item Rows
        const firstActionRow = new ActionRowBuilder().addComponents(inputs.usernameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(inputs.addressInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(inputs.signatureInput);

        // Verify Wallet Modal
        const verifyModal = new ModalBuilder()
            .setCustomId('verifyModal')
            .setTitle('Wallet Verification')
            .setComponents(
                firstActionRow,
                secondActionRow,
                thirdActionRow
            )

        
        await interaction.showModal(verifyModal);
        
        const filter = (interaction) => interaction.customId === 'verifyModal';

        let address, signature;

        await interaction.awaitModalSubmit({ time: 60_000, filter })
            .then(interaction => {
                interaction.reply({ content:'Address and signature submitted...', ephemeral: true });
                address = interaction.fields.getTextInputValue('modalAddress');
                signature = interaction.fields.getTextInputValue('modalSignature');
            })
            .catch(err => interaction.reply({ content:'Address and signature form not submitted...', ephemeral: true }));


        //Verify provided address matches Ed25519 and Sr25519 standards, then verify signature
        const isValid = await isValidAddress(address);
        if (!isValid) {
            await interaction.followUp({ content:'The provided address is invalid, please verify and try again', ephemeral: true });
            return;
        } else {
            await cryptoWaitReady()
            const validSig = isValidSignature(
              username,
              signature,
              address
            );
            if(!validSig) {
                await interaction.followUp({ content:'The provided signature is invalid, please verify and try again', ephemeral: true });
            } else {
                await interaction.followUp({ content:'The provided Signature is Valid!', ephemeral: true });
            };
          };
    },
};