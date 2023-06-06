const { 
	Events,
	ModalBuilder,
	TextInputStyle,
	TextInputBuilder,
	ActionRowBuilder,
} = require('discord.js');
const check = require('../scripts/connect.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.guild) return; // Edge Case to ensure interaction has a guild.

		if (interaction.isChatInputCommand()) { //Check if Slash Command
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		} else if (interaction.isButton()) { //Check if Button
			if(interaction.customId === 'verifyButton') {
				const username = interaction.user.username + "#" + interaction.user.discriminator;

				// Define Inputs and Information type
				const verifyModal = new ModalBuilder()
				.setCustomId("verifyModal")
				.setTitle("Wallet Verification")
				.setComponents(
					new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId("modalUsername")
						.setLabel("Your Username")
						.setStyle(TextInputStyle.Short)
						.setValue(username)
						.setRequired(true)
					),
					new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId("modalAddress")
						.setLabel("Your Address")
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
					),
					new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId("modalSignature")
						.setLabel("Signature Provided from signature")
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
					)
				);

				await interaction.showModal(verifyModal);
			}
				
			
		} else if (interaction.isModalSubmit()) { //Check if Modal Submission
			await interaction.deferReply();
			if(interaction.customId === "verifyModal") {
				interaction.followUp({
                    content: "Address and signature submitted...",
                    ephemeral: true,
                });
				const address = interaction.fields.getTextInputValue("modalAddress");
				const signature = interaction.fields.getTextInputValue("modalSignature");
				const username = interaction.fields.getTextInputValue("modalUsername");
				let checkPass;
				try {
					await check(username, signature, address);
					interaction.followUp({
						content: "Verification Complete!",
						ephemeral: true,
					});
					checkPass = true;
				} catch (error) {
					interaction.followUp({
						content: error.message,
						ephemeral: true,
					});
					checkPass = false;
				}

				//Assign Role If Balance is > 0, Signature, and Address are Valid
				
				if (checkPass) {
					//const role = interaction.options.getRole('1085319465127915662');
					let role = "1085319465127915662";
					interaction.member.roles.add(role)
				}	
			}

		} else {
			console.log(`Unhandled interaction type: ${interaction.type}`);
			return;
		}
	},
};