const {
    ActionRowBuilder,
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

// Define Embed for Instructions
const instructionsEmbed = new EmbedBuilder()
    .setColor("#fafafa")
    .setTitle("Verified Holder Role Verification")
    .setDescription(
        "Please ensure to read the instructions carefully to ensure your verification works correctly."
    )
    .addFields(
        { name: "Requirements", value: "To gain the Verified Holder role you must have a setup Subspace wallet with the extension installed and at least 0.1 tSSC in your wallet" },
        { name: "1.", value: "Open the link: [here](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Feu-0.gemini-2a.subspace.network%2Fws#/signing)"},
        { name: "2.", value: "Paste your full discord username into the `sign the following data` section"},
        { name: "3.", value: "click `Sign message` & Provide your password to the wallet extension"},
        { name: "4.", value: "Copy the `signature of supplied data`"},
        { name: "5.", value: "Return to Discord"},
        { name: "6.", value: "Click `Verify`"},
        { name: "7.", value: "Paste your public address in the `Address` field"},
        { name: "8.", value: "Paste your signature in the `Signature` field"},
        { name: "9.", value: "Click `Submit`"},
    )
    .setImage('https://i.imgur.com/ooqnC2X.gif')
    
// Define Button to prompt for Verification
const verifyButton = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('verifyButton')
					.setLabel('Verify')
					.setStyle(ButtonStyle.Primary),
			);



module.exports = {
    //Build the Slash Command and parameters
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("links an address to your Discord account")
        .addStringOption((option) =>
            option
                .setName("chain")
                .setDescription("Specify which network you are verifying for")
                .setRequired(false)
        ),
    async execute(interaction) {
        // Show reply embed
        await interaction.reply({ embeds: [instructionsEmbed], components: [verifyButton], ephemeral: true });
        //await interaction.reply({ content: "Verifying your account...", ephemeral: true });
        }
};
