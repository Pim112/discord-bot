const {ApplicationCommandOptionType} = require('discord.js');
const {useMainPlayer} = require('discord-player');
const {isInVoiceChannel} = require('../utils/voicechannel');

const { getData } = require('spotify-url-info')(require('node-fetch'));

module.exports = {
    name: 'play',
    description: 'Play a song in your channel!',
    options: [
        {
            name: 'query',
            type: ApplicationCommandOptionType.String,
            description: 'The song you want to play',
            required: true,
        },
    ],
    async execute(interaction) {
        const {default: Conf} = await import('conf');
        try {
            const inVoiceChannel = isInVoiceChannel(interaction);
            if (!inVoiceChannel) {
                return;
            }

            await interaction.deferReply();

            const player = useMainPlayer();
            let query = interaction.options.getString('query');
            
            // const regex = /(?:https?:\/\/)?(?:w{3}\.)?\w*\.?spotify\.\w+\/\w+\/\w+/;
            // const match = query.match(regex);
            
            // if (match) {
            //     try {
            //         const info = await getData(match[0]);
            //         query = `${info.name} ${info.artists.map(a => a.name).join(', ')}`;
            //     } catch(e) {
            //         console.log(e)
            //     }
            // }

            // console.log(query)

            const searchResult = await player.search(query);
            if (!searchResult.hasTracks()) return void interaction.followUp({content: 'No results were found!'});

            try {
                const config = new Conf({projectName: 'volume'});

                await player.play(interaction.member.voice.channel.id, searchResult, {
                    nodeOptions: {
                        metadata: {
                            channel: interaction.channel,
                            client: interaction.guild?.members.me,
                            requestedBy: interaction.user.username,
                        },
                        leaveOnEmptyCooldown: 300000,
                        leaveOnEmpty: false,
                        leaveOnEnd: false,
                        bufferingTimeout: 0,
                        volume: config.get('volume') || 10,
                        //defaultFFmpegFilters: ['lofi', 'bassboost', 'normalizer']
                    },
                });

                await interaction.followUp({
                    content: `⏱ | Loading your ${searchResult.playlist ? 'playlist' : 'track'}...`,
                });
            } catch (error) {
                await interaction.editReply({
                    content: 'An error has occurred!',
                });
                return console.log(error);
            }
        } catch (error) {
            await interaction.reply({
                content: 'There was an error trying to execute that command: ' + error.message,
            });
        }
    },
};
