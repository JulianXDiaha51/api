import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits, Events } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const OWNER_ID = process.env.OWNER_ID || 'your_owner_id_here'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
})

const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands and help information'),
  
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View API statistics')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Stats action to perform')
        .setRequired(false)
        .addChoices(
          { name: 'Start auto stats (30s)', value: 'start_auto' },
          { name: 'Stop auto stats', value: 'stop_auto' },
          { name: 'View current stats', value: 'view' }
        )
    )
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Time period for statistics')
        .setRequired(false)
        .addChoices(
          { name: 'Last 5 minutes', value: '5m' },
          { name: 'Last 15 minutes', value: '15m' },
          { name: 'Last 30 minutes', value: '30m' },
          { name: 'Last hour', value: '1h' },
          { name: 'Last 6 hours', value: '6h' },
          { name: 'Last 12 hours', value: '12h' },
          { name: 'Last day', value: '1d' },
          { name: 'Last 3 days', value: '3d' },
          { name: 'Last week', value: '7d' }
        )
    ),
  
  new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Toggle maintenance mode')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Enable or disable maintenance mode')
        .setRequired(true)
        .addChoices(
          { name: 'On', value: 'on' },
          { name: 'Off', value: 'off' }
        )
    ),
  
  new SlashCommandBuilder()
    .setName('activity')
    .setDescription('Manage bot activity status')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Activity action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Set custom activity', value: 'set_custom' },
          { name: 'Reset to auto', value: 'reset_auto' },
          { name: 'Show current', value: 'show_current' }
        )
    )
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Custom status text (only for set_custom action)')
        .setRequired(false)
    ),
  
  new SlashCommandBuilder()
    .setName('apikey')
    .setDescription('Manage API keys')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add new API key')
        .addStringOption(option =>
          option.setName('key')
            .setDescription('API key to add')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name for the API key')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Category for the API key')
            .setRequired(true)
            .addChoices(
              { name: 'Free', value: 'free' },
              { name: 'Premium', value: 'premium' },
              { name: 'VIP', value: 'vip' },
              { name: 'Admin', value: 'admin' }
            )
        )
        .addStringOption(option =>
          option.setName('ratelimit')
            .setDescription('Rate limit for the API key')
            .setRequired(true)
            .addChoices(
              { name: '100/minute', value: '100/minute' },
              { name: '500/minute', value: '500/minute' },
              { name: '1000/minute', value: '1000/minute' },
              { name: '5000/day', value: '5000/day' },
              { name: '10000/day', value: '10000/day' },
              { name: '50000/day', value: '50000/day' },
              { name: 'Unlimited', value: 'unlimited' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete API key')
        .addStringOption(option =>
          option.setName('key')
            .setDescription('API key to delete')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable API key requirement')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Enable or disable API key requirement')
            .setRequired(true)
            .addChoices(
              { name: 'Enable', value: 'enable' },
              { name: 'Disable', value: 'disable' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all API keys')
    ),
  
  new SlashCommandBuilder()
    .setName('endpoint')
    .setDescription('Manage API endpoints')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add new API endpoint')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Display name for documentation (e.g., "Weather API", "Translate Text")')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('filename')
            .setDescription('File name for endpoint (e.g., "weather", "translate")')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Category folder for the endpoint')
            .setRequired(true)
            .addChoices(
              { name: 'AI', value: 'ai' },
              { name: 'Maker', value: 'maker' },
              { name: 'Random', value: 'random' },
              { name: 'Tools', value: 'tools' },
              { name: 'Games', value: 'games' },
              { name: 'Social', value: 'social' },
              { name: 'News', value: 'news' },
              { name: 'Custom', value: 'custom' }
            )
        )
        .addStringOption(option =>
          option.setName('method')
            .setDescription('HTTP method for the endpoint')
            .setRequired(true)
            .addChoices(
              { name: 'GET', value: 'GET' },
              { name: 'POST', value: 'POST' },
              { name: 'PUT', value: 'PUT' },
              { name: 'DELETE', value: 'DELETE' }
            )
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Description of what the endpoint does')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('parameters')
            .setDescription('Required parameters (comma-separated, e.g., "text,limit")')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('optional_parameters')
            .setDescription('Optional parameters (comma-separated, e.g., "format,count")')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete an API endpoint')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Endpoint name to delete')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Category of the endpoint to delete')
            .setRequired(true)
            .addChoices(
              { name: 'AI', value: 'ai' },
              { name: 'Maker', value: 'maker' },
              { name: 'Random', value: 'random' },
              { name: 'Tools', value: 'tools' },
              { name: 'Games', value: 'games' },
              { name: 'Social', value: 'social' },
              { name: 'News', value: 'news' },
              { name: 'Custom', value: 'custom' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all available API endpoints')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('scan')
        .setDescription('Scan and show detected API paths from folder structure')
    ),
  
  new SlashCommandBuilder()
    .setName('owner')
    .setDescription('Owner-only commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('eval')
        .setDescription('Execute JavaScript code')
        .addStringOption(option =>
          option.setName('code')
            .setDescription('JavaScript code to execute')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('restart')
        .setDescription('Restart the bot')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('shutdown')
        .setDescription('Shutdown the bot')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('broadcast')
        .setDescription('Send message to all guilds')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Message to broadcast')
            .setRequired(true)
        )
    ),
  
  new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Auto-moderation settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Setup auto-moderation')
        .addChannelOption(option =>
          option.setName('log_channel')
            .setDescription('Channel for moderation logs')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('spam_threshold')
            .setDescription('Messages per minute before action')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(20)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle auto-moderation features')
        .addStringOption(option =>
          option.setName('feature')
            .setDescription('Feature to toggle')
            .setRequired(true)
            .addChoices(
              { name: 'Anti-Spam', value: 'antispam' },
              { name: 'Auto-Delete Links', value: 'autodelete' },
              { name: 'Caps Filter', value: 'caps' },
              { name: 'Bad Words Filter', value: 'badwords' }
            )
        )
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable or disable the feature')
            .setRequired(true)
        )
    ),
  
  new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Auto-role management')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add role to auto-assign')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('Role to auto-assign')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('delay')
            .setDescription('Delay in seconds before assigning role')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(300)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove role from auto-assign')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('Role to remove from auto-assign')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all auto-assign roles')
    )
]

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)

let statsData = {
  totalRequests: 0,
  requestsByTime: new Map(),
  topRequests: new Map(),
  startTime: Date.now(),
  lastReset: Date.now()
}

let autoStatsChannel = null
let autoStatsMessage = null
let autoStatsInterval = null
let customActivity = null

let autoModSettings = new Map()
let autoRoles = new Map()
let userMessageCounts = new Map()
let spamCooldowns = new Map()

const badWords = ['spam', 'scam', 'hack', 'virus', 'malware', 'phishing']

client.once('ready', async () => {
  console.log(`Discord bot logged in as ${client.user.tag}`)
  
  try {
    console.log('Started refreshing application (/) commands.')
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    )
    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error('Error refreshing application commands:', error)
  }

  setInterval(() => {
    if (!customActivity) {
      const activities = [
        { name: `${statsData.totalRequests} API requests`, type: 3 },
        { name: 'with JulzzBot APIs', type: 0 },
        { name: 'the server status', type: 3 },
        { name: 'API documentation', type: 3 },
        { name: `${client.guilds.cache.size} servers`, type: 3 },
        { name: `${client.users.cache.size} users`, type: 3 },
        { name: 'the code compile', type: 0 },
        { name: 'the network traffic', type: 3 },
        { name: 'the system logs', type: 3 },
        { name: 'the database queries', type: 3 },
        { name: 'the API endpoints', type: 3 },
        { name: 'the error logs', type: 3 },
        { name: 'the performance metrics', type: 3 },
        { name: 'the security scans', type: 3 },
        { name: 'the backup process', type: 3 },
        { name: 'the cache updates', type: 3 },
        { name: 'the rate limits', type: 3 },
        { name: 'the authentication', type: 3 },
        { name: 'the data validation', type: 3 },
        { name: 'the response times', type: 3 }
      ]
      const randomActivity = activities[Math.floor(Math.random() * activities.length)]
      client.user.setActivity(randomActivity.name, { type: randomActivity.type })
    }
  }, 15000)
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  const { commandName } = interaction

  try {
    switch (commandName) {
      case 'help':
        await handleHelp(interaction)
        break
      case 'stats':
        await handleStats(interaction)
        break
      case 'activity':
        await handleActivity(interaction)
        break
      case 'maintenance':
        await handleMaintenance(interaction)
        break
      case 'apikey':
        await handleApiKey(interaction)
        break
      case 'endpoint':
        await handleEndpoint(interaction)
        break
      case 'owner':
        await handleOwner(interaction)
        break
      case 'automod':
        await handleAutoMod(interaction)
        break
      case 'autorole':
        await handleAutoRole(interaction)
        break
    }
  } catch (error) {
    console.error('Error handling interaction:', error)
    await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true })
  }
})

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return
  
  const guildId = message.guild?.id
  if (!guildId) return
  
  const settings = autoModSettings.get(guildId)
  if (!settings) return
  
  try {
    if (settings.antispam) {
      await handleAntiSpam(message, settings)
    }
    
    if (settings.autodelete) {
      await handleAutoDelete(message, settings)
    }
    
    if (settings.caps) {
      await handleCapsFilter(message, settings)
    }
    
    if (settings.badwords) {
      await handleBadWordsFilter(message, settings)
    }
  } catch (error) {
    console.error('Error in auto-moderation:', error)
  }
})

client.on(Events.GuildMemberAdd, async member => {
  const guildId = member.guild.id
  const roles = autoRoles.get(guildId)
  
  if (!roles || roles.length === 0) return
  
  try {
    for (const roleData of roles) {
      const role = member.guild.roles.cache.get(roleData.id)
      if (role) {
        if (roleData.delay > 0) {
          setTimeout(async () => {
            try {
              await member.roles.add(role)
              console.log(`Auto-assigned role ${role.name} to ${member.user.tag}`)
            } catch (error) {
              console.error(`Failed to assign role ${role.name}:`, error)
            }
          }, roleData.delay * 1000)
        } else {
          await member.roles.add(role)
          console.log(`Auto-assigned role ${role.name} to ${member.user.tag}`)
        }
      }
    }
  } catch (error) {
    console.error('Error in auto-role assignment:', error)
  }
})

async function handleAntiSpam(message, settings) {
  const userId = message.author.id
  const now = Date.now()
  
  if (!userMessageCounts.has(userId)) {
    userMessageCounts.set(userId, { count: 1, resetTime: now + 60000 })
    return
  }
  
  const data = userMessageCounts.get(userId)
  if (now > data.resetTime) {
    data.count = 1
    data.resetTime = now + 60000
  } else {
    data.count++
    if (data.count > settings.spamThreshold) {
      if (spamCooldowns.has(userId)) return
      
      spamCooldowns.set(userId, now + 300000)
      setTimeout(() => spamCooldowns.delete(userId), 300000)
      
      try {
        await message.delete()
        await message.channel.send(`⚠️ ${message.author}, please slow down! You're sending messages too quickly.`)
        
        const logChannel = message.guild.channels.cache.get(settings.logChannel)
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle('🛡️ Anti-Spam Action')
            .setColor(0xff9900)
            .setDescription(`User ${message.author} was flagged for spam`)
            .addFields(
              { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
              { name: 'Channel', value: message.channel.toString(), inline: true },
              { name: 'Messages', value: `${data.count}/${settings.spamThreshold}`, inline: true }
            )
            .setTimestamp()
          
          await logChannel.send({ embeds: [embed] })
        }
      } catch (error) {
        console.error('Error handling spam:', error)
      }
    }
  }
  
  userMessageCounts.set(userId, data)
}

async function handleAutoDelete(message, settings) {
  const content = message.content.toLowerCase()
  const suspiciousPatterns = [
    /discord\.gg\/\w+/,
    /discord\.com\/invite\/\w+/,
    /bit\.ly\/\w+/,
    /tinyurl\.com\/\w+/,
    /t\.me\/\w+/,
    /telegram\.me\/\w+/
  ]
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(content))
  
  if (isSuspicious) {
    try {
      await message.delete()
      await message.channel.send(`⚠️ ${message.author}, suspicious links are not allowed!`)
      
      const logChannel = message.guild.channels.cache.get(settings.logChannel)
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🛡️ Auto-Delete Action')
          .setColor(0xff0000)
          .setDescription(`Suspicious link deleted from ${message.author}`)
          .addFields(
            { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Channel', value: message.channel.toString(), inline: true },
            { name: 'Content', value: message.content.slice(0, 1000), inline: false }
          )
          .setTimestamp()
        
        await logChannel.send({ embeds: [embed] })
      }
    } catch (error) {
      console.error('Error handling auto-delete:', error)
    }
  }
}

async function handleCapsFilter(message, settings) {
  const content = message.content
  const capsCount = (content.match(/[A-Z]/g) || []).length
  const totalChars = content.replace(/\s/g, '').length
  
  if (totalChars > 10 && capsCount / totalChars > 0.7) {
    try {
      await message.delete()
      await message.channel.send(`⚠️ ${message.author}, please don't use excessive caps!`)
      
      const logChannel = message.guild.channels.cache.get(settings.logChannel)
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🛡️ Caps Filter Action')
          .setColor(0xff9900)
          .setDescription(`Excessive caps message deleted from ${message.author}`)
          .addFields(
            { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Channel', value: message.channel.toString(), inline: true },
            { name: 'Content', value: content.slice(0, 1000), inline: false }
          )
          .setTimestamp()
        
        await logChannel.send({ embeds: [embed] })
      }
    } catch (error) {
      console.error('Error handling caps filter:', error)
    }
  }
}

async function handleBadWordsFilter(message, settings) {
  const content = message.content.toLowerCase()
  const foundBadWords = badWords.filter(word => content.includes(word))
  
  if (foundBadWords.length > 0) {
    try {
      await message.delete()
      await message.channel.send(`⚠️ ${message.author}, inappropriate language is not allowed!`)
      
      const logChannel = message.guild.channels.cache.get(settings.logChannel)
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🛡️ Bad Words Filter Action')
          .setColor(0xff0000)
          .setDescription(`Inappropriate message deleted from ${message.author}`)
          .addFields(
            { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Channel', value: message.channel.toString(), inline: true },
            { name: 'Detected Words', value: foundBadWords.join(', '), inline: false },
            { name: 'Content', value: message.content.slice(0, 1000), inline: false }
          )
          .setTimestamp()
        
        await logChannel.send({ embeds: [embed] })
      }
    } catch (error) {
      console.error('Error handling bad words filter:', error)
    }
  }
}

function updateStats(endpoint = 'unknown') {
  statsData.totalRequests++
  const now = Date.now()
  const timeKey = Math.floor(now / 60000)
  
  if (!statsData.requestsByTime.has(timeKey)) {
    statsData.requestsByTime.set(timeKey, 0)
  }
  statsData.requestsByTime.set(timeKey, statsData.requestsByTime.get(timeKey) + 1)
  
  if (!statsData.topRequests.has(endpoint)) {
    statsData.topRequests.set(endpoint, 0)
  }
  statsData.topRequests.set(endpoint, statsData.topRequests.get(endpoint) + 1)
}

function getTimeRange(timeStr) {
  const now = Date.now()
  let startTime = now
  
  switch (timeStr) {
    case '5m':
      startTime = now - (5 * 60 * 1000)
      break
    case '15m':
      startTime = now - (15 * 60 * 1000)
      break
    case '30m':
      startTime = now - (30 * 60 * 1000)
      break
    case '1h':
      startTime = now - (60 * 60 * 1000)
      break
    case '6h':
      startTime = now - (6 * 60 * 60 * 1000)
      break
    case '12h':
      startTime = now - (12 * 60 * 60 * 1000)
      break
    case '1d':
      startTime = now - (24 * 60 * 60 * 1000)
      break
    case '3d':
      startTime = now - (3 * 24 * 60 * 60 * 1000)
      break
    case '7d':
      startTime = now - (7 * 24 * 60 * 60 * 1000)
      break
    default:
      startTime = now - (30 * 60 * 1000)
  }
  
  return { startTime, endTime: now }
}

async function generateStatsEmbed(timeStr = '30m') {
  const { startTime, endTime } = getTimeRange(timeStr)
  const uptime = Math.floor((Date.now() - statsData.startTime) / 1000)
  const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
  
  let requestsInPeriod = 0
  const startMinute = Math.floor(startTime / 60000)
  const endMinute = Math.floor(endTime / 60000)
  
  for (let minute = startMinute; minute <= endMinute; minute++) {
    if (statsData.requestsByTime.has(minute)) {
      requestsInPeriod += statsData.requestsByTime.get(minute)
    }
  }
  
  const memoryUsage = process.memoryUsage()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory
  const memoryPercent = Math.round((usedMemory / totalMemory) * 100)
  
  const cpuUsage = process.cpuUsage()
  const loadAvg = os.loadavg()
  const cpuCount = os.cpus().length
  
  const topRequests = Array.from(statsData.topRequests.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  const embed = new EmbedBuilder()
    .setTitle('📊 Enhanced API Statistics')
    .setColor(0x00ff00)
    .setTimestamp()
    .addFields(
      { name: '🟢 Status', value: 'Online', inline: true },
      { name: '⏱️ Uptime', value: uptimeStr, inline: true },
      { name: '📈 Total Requests', value: statsData.totalRequests.toString(), inline: true },
      { name: `📊 Requests (${timeStr})`, value: requestsInPeriod.toString(), inline: true },
      { name: '💾 RAM Usage', value: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(totalMemory / 1024 / 1024 / 1024)}GB (${memoryPercent}%)`, inline: true },
      { name: '🖥️ CPU Load', value: `${loadAvg[0].toFixed(2)} (${cpuCount} cores)`, inline: true },
      { name: '⚡ Process CPU', value: `${Math.round(cpuUsage.user / 1000000)}ms`, inline: true },
      { name: '🌐 Node.js', value: `v${process.version}`, inline: true },
      { name: '🏗️ Platform', value: `${os.platform()} ${os.arch()}`, inline: true }
    )

  if (topRequests.length > 0) {
    const topRequestsText = topRequests.map(([endpoint, count], index) => 
      `${index + 1}. \`${endpoint}\` - ${count} requests`
    ).join('\n')
    embed.addFields({ name: '🔥 Top API Requests', value: topRequestsText, inline: false })
  }

  return embed
}

function isOwner(userId) {
  return userId === OWNER_ID
}

async function handleOwner(interaction) {
  if (!isOwner(interaction.user.id)) {
    await interaction.reply({ content: '❌ This command is restricted to the bot owner only.', ephemeral: true })
    return
  }

  const subcommand = interaction.options.getSubcommand()
  
  try {
    switch (subcommand) {
      case 'eval':
        await handleEval(interaction)
        break
      case 'restart':
        await handleRestart(interaction)
        break
      case 'shutdown':
        await handleShutdown(interaction)
        break
      case 'broadcast':
        await handleBroadcast(interaction)
        break
    }
  } catch (error) {
    console.error('Error handling owner command:', error)
    await interaction.reply({ content: '❌ Error executing owner command.', ephemeral: true })
  }
}

async function handleEval(interaction) {
  const code = interaction.options.getString('code')
  
  try {
    const result = eval(code)
    const embed = new EmbedBuilder()
      .setTitle('🔧 Eval Result')
      .setColor(0x00ff00)
      .setDescription(`\`\`\`js\n${String(result).slice(0, 1000)}\`\`\``)
      .setTimestamp()
    
    await interaction.reply({ embeds: [embed], ephemeral: true })
  } catch (error) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Eval Error')
      .setColor(0xff0000)
      .setDescription(`\`\`\`js\n${error.message}\`\`\``)
      .setTimestamp()
    
    await interaction.reply({ embeds: [embed], ephemeral: true })
  }
}

async function handleRestart(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🔄 Bot Restart')
    .setColor(0xff9900)
    .setDescription('Restarting bot...')
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
  process.exit(0)
}

async function handleShutdown(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🛑 Bot Shutdown')
    .setColor(0xff0000)
    .setDescription('Shutting down bot...')
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
  process.exit(1)
}

async function handleBroadcast(interaction) {
  const message = interaction.options.getString('message')
  const guilds = client.guilds.cache
  
  let successCount = 0
  let failCount = 0
  
  for (const [guildId, guild] of guilds) {
    try {
      const systemChannel = guild.systemChannel || guild.channels.cache.find(ch => ch.type === 0)
      if (systemChannel) {
        await systemChannel.send(message)
        successCount++
      } else {
        failCount++
      }
    } catch (error) {
      failCount++
    }
  }
  
  const embed = new EmbedBuilder()
    .setTitle('📢 Broadcast Complete')
    .setColor(0x00ff00)
    .setDescription(`Message sent to ${successCount} guilds. Failed: ${failCount}`)
    .addFields(
      { name: 'Message', value: message, inline: false }
    )
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed], ephemeral: true })
}

async function handleAutoMod(interaction) {
  const subcommand = interaction.options.getSubcommand()
  
  try {
    switch (subcommand) {
      case 'setup':
        await handleAutoModSetup(interaction)
        break
      case 'toggle':
        await handleAutoModToggle(interaction)
        break
    }
  } catch (error) {
    console.error('Error handling automod command:', error)
    await interaction.reply({ content: '❌ Error managing auto-moderation.', ephemeral: true })
  }
}

async function handleAutoModSetup(interaction) {
  const logChannel = interaction.options.getChannel('log_channel')
  const spamThreshold = interaction.options.getInteger('spam_threshold') || 5
  
  const guildId = interaction.guild.id
  autoModSettings.set(guildId, {
    logChannel: logChannel.id,
    spamThreshold,
    antispam: true,
    autodelete: true,
    caps: true,
    badwords: true
  })
  
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Auto-Moderation Setup')
    .setColor(0x00ff00)
    .setDescription('Auto-moderation has been configured!')
    .addFields(
      { name: 'Log Channel', value: `<#${logChannel.id}>`, inline: true },
      { name: 'Spam Threshold', value: `${spamThreshold} messages/minute`, inline: true },
      { name: 'Features', value: 'Anti-Spam, Auto-Delete Links, Caps Filter, Bad Words Filter', inline: false }
    )
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
}

async function handleAutoModToggle(interaction) {
  const feature = interaction.options.getString('feature')
  const enabled = interaction.options.getBoolean('enabled')
  
  const guildId = interaction.guild.id
  if (!autoModSettings.has(guildId)) {
    await interaction.reply({ content: '❌ Auto-moderation not set up. Use `/automod setup` first.', ephemeral: true })
    return
  }
  
  const settings = autoModSettings.get(guildId)
  settings[feature] = enabled
  autoModSettings.set(guildId, settings)
  
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Auto-Moderation Toggle')
    .setColor(enabled ? 0x00ff00 : 0xff0000)
    .setDescription(`${feature.charAt(0).toUpperCase() + feature.slice(1)} has been ${enabled ? 'enabled' : 'disabled'}.`)
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
}

async function handleAutoRole(interaction) {
  const subcommand = interaction.options.getSubcommand()
  
  try {
    switch (subcommand) {
      case 'add':
        await handleAutoRoleAdd(interaction)
        break
      case 'remove':
        await handleAutoRoleRemove(interaction)
        break
      case 'list':
        await handleAutoRoleList(interaction)
        break
    }
  } catch (error) {
    console.error('Error handling autorole command:', error)
    await interaction.reply({ content: '❌ Error managing auto-roles.', ephemeral: true })
  }
}

async function handleAutoRoleAdd(interaction) {
  const role = interaction.options.getRole('role')
  const delay = interaction.options.getInteger('delay') || 0
  
  const guildId = interaction.guild.id
  if (!autoRoles.has(guildId)) {
    autoRoles.set(guildId, [])
  }
  
  const roles = autoRoles.get(guildId)
  if (roles.some(r => r.id === role.id)) {
    await interaction.reply({ content: '❌ This role is already set for auto-assignment.', ephemeral: true })
    return
  }
  
  roles.push({ id: role.id, name: role.name, delay })
  autoRoles.set(guildId, roles)
  
  const embed = new EmbedBuilder()
    .setTitle('🎭 Auto-Role Added')
    .setColor(0x00ff00)
    .setDescription(`Role ${role} will be automatically assigned to new members.`)
    .addFields(
      { name: 'Role', value: role.toString(), inline: true },
      { name: 'Delay', value: `${delay} seconds`, inline: true }
    )
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
}

async function handleAutoRoleRemove(interaction) {
  const role = interaction.options.getRole('role')
  
  const guildId = interaction.guild.id
  if (!autoRoles.has(guildId)) {
    await interaction.reply({ content: '❌ No auto-roles configured for this server.', ephemeral: true })
    return
  }
  
  const roles = autoRoles.get(guildId)
  const roleIndex = roles.findIndex(r => r.id === role.id)
  
  if (roleIndex === -1) {
    await interaction.reply({ content: '❌ This role is not set for auto-assignment.', ephemeral: true })
    return
  }
  
  roles.splice(roleIndex, 1)
  autoRoles.set(guildId, roles)
  
  const embed = new EmbedBuilder()
    .setTitle('🎭 Auto-Role Removed')
    .setColor(0xff0000)
    .setDescription(`Role ${role} will no longer be automatically assigned.`)
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
}

async function handleAutoRoleList(interaction) {
  const guildId = interaction.guild.id
  const roles = autoRoles.get(guildId) || []
  
  if (roles.length === 0) {
    await interaction.reply({ content: '❌ No auto-roles configured for this server.', ephemeral: true })
    return
  }
  
  const rolesList = roles.map((role, index) => 
    `${index + 1}. <@&${role.id}> (${role.delay}s delay)`
  ).join('\n')
  
  const embed = new EmbedBuilder()
    .setTitle('🎭 Auto-Roles List')
    .setColor(0x0099ff)
    .setDescription(rolesList)
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
}

async function handleHelp(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🤖 JulzzBot API Bot Commands')
    .setColor(0x0099ff)
    .setDescription('Here are all available commands for the JulzzBot API bot:')
    .addFields(
      { name: '📊 `/stats`', value: 'View enhanced API statistics with top requests and system info', inline: false },
      { name: '🎮 `/activity`', value: 'Manage bot activity status (custom/auto)', inline: false },
      { name: '🔧 `/maintenance`', value: 'Toggle maintenance mode for the API', inline: false },
      { name: '🔑 `/apikey`', value: 'Manage API keys with categories and rate limits', inline: false },
      { name: '🚀 `/endpoint`', value: 'Add, list, and manage API endpoints automatically', inline: false },
      { name: '👑 `/owner`', value: 'Owner-only commands (eval, restart, shutdown, broadcast)', inline: false },
      { name: '🛡️ `/automod`', value: 'Auto-moderation settings (anti-spam, filters)', inline: false },
      { name: '🎭 `/autorole`', value: 'Auto-role assignment for new members', inline: false }
    )
    .addFields(
      { name: '📊 Enhanced Stats', value: '• Real-time system monitoring\n• Top API requests tracking\n• RAM and CPU usage\n• Platform information', inline: false },
      { name: '🛡️ Auto-Moderation', value: '• Anti-spam protection\n• Auto-delete suspicious links\n• Caps filter\n• Bad words filter', inline: false },
      { name: '🎭 Auto-Roles', value: '• Automatic role assignment\n• Configurable delays\n• Multiple roles support', inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'JulzzBot API Bot • Enhanced with auto-moderation and auto-roles' })

  await interaction.reply({ embeds: [embed] })
}

async function handleStats(interaction) {
  const action = interaction.options.getString('action') || 'view'
  const timeStr = interaction.options.getString('time') || '30m'
  
  switch (action) {
    case 'start_auto':
      if (autoStatsInterval) {
        clearInterval(autoStatsInterval)
      }
      
      autoStatsChannel = interaction.channel
      const embed = await generateStatsEmbed(timeStr)
      const message = await interaction.reply({ embeds: [embed], fetchReply: true })
      autoStatsMessage = message
      
      autoStatsInterval = setInterval(async () => {
        if (autoStatsChannel && autoStatsMessage) {
          try {
            const updatedEmbed = await generateStatsEmbed(timeStr)
            await autoStatsMessage.edit({ embeds: [updatedEmbed] })
          } catch (error) {
            console.error('Error updating auto stats:', error)
          }
        }
      }, 30000)
      
      await interaction.followUp({ content: '✅ Auto stats enabled! Stats will update every 30 seconds.', ephemeral: true })
      break
      
    case 'stop_auto':
      if (autoStatsInterval) {
        clearInterval(autoStatsInterval)
        autoStatsInterval = null
        autoStatsChannel = null
        autoStatsMessage = null
        await interaction.reply({ content: '✅ Auto stats disabled!', ephemeral: true })
      } else {
        await interaction.reply({ content: '❌ Auto stats is not currently enabled.', ephemeral: true })
      }
      break
      
    case 'view':
    default:
      const statsEmbed = await generateStatsEmbed(timeStr)
      await interaction.reply({ embeds: [statsEmbed] })
      break
  }
}

async function handleActivity(interaction) {
  const action = interaction.options.getString('action')
  const status = interaction.options.getString('status')
  
  try {
    switch (action) {
      case 'set_custom':
        if (!status) {
          await interaction.reply({ content: '❌ Please provide a custom status text!', ephemeral: true })
          return
        }
        
        customActivity = status
        await client.user.setActivity(status, { type: 3 })
        
        const setEmbed = new EmbedBuilder()
          .setTitle('🎮 Activity Status')
          .setColor(0x00ff00)
          .setDescription(`✅ Custom activity set to: **${status}**`)
          .setTimestamp()
        
        await interaction.reply({ embeds: [setEmbed] })
        break
        
      case 'reset_auto':
        customActivity = null
        await client.user.setActivity('API requests', { type: 3 })
        
        const resetEmbed = new EmbedBuilder()
          .setTitle('🎮 Activity Status')
          .setColor(0x0099ff)
          .setDescription('✅ Activity reset to automatic rotation')
          .setTimestamp()
        
        await interaction.reply({ embeds: [resetEmbed] })
        break
        
      case 'show_current':
        const currentActivity = client.user.presence.activities[0]
        const activityText = currentActivity ? `${currentActivity.name} (${getActivityTypeName(currentActivity.type)})` : 'No activity set'
        
        const showEmbed = new EmbedBuilder()
          .setTitle('🎮 Current Activity')
          .setColor(0x0099ff)
          .setDescription(`**Current Status:** ${activityText}\n**Mode:** ${customActivity ? 'Custom' : 'Automatic'}`)
          .setTimestamp()
        
        await interaction.reply({ embeds: [showEmbed] })
        break
    }
  } catch (error) {
    console.error('Error handling activity command:', error)
    await interaction.reply({ content: '❌ Error managing activity status.', ephemeral: true })
  }
}

function getActivityTypeName(type) {
  const types = {
    0: 'Playing',
    1: 'Streaming',
    2: 'Listening',
    3: 'Watching',
    4: 'Custom',
    5: 'Competing'
  }
  return types[type] || 'Unknown'
}

async function handleMaintenance(interaction) {
  const action = interaction.options.getString('action')
  const enabled = action === 'on'
  
  try {
    const settingsPath = path.join(__dirname, 'settings.json')
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    
    if (!settings.maintenance) {
      settings.maintenance = {}
    }
    
    settings.maintenance.enabled = enabled
    settings.maintenance.message = enabled ? 'API is currently under maintenance. Please try again later.' : ''
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    
    const embed = new EmbedBuilder()
      .setTitle('🔧 Maintenance Mode')
      .setColor(enabled ? 0xff9900 : 0x00ff00)
      .setDescription(`Maintenance mode has been ${enabled ? 'enabled' : 'disabled'}.`)
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  } catch (error) {
    await interaction.reply({ content: 'Error updating maintenance mode.', ephemeral: true })
  }
}

async function handleApiKey(interaction) {
  const subcommand = interaction.options.getSubcommand()
  
  try {
    const settingsPath = path.join(__dirname, 'settings.json')
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    
    if (!settings.apiKeys) {
      settings.apiKeys = []
    }
    
    if (!settings.apiSettings) {
      settings.apiSettings = {}
    }
    
    if (!settings.apiSettings.apikey) {
      settings.apiSettings.apikey = {}
    }
    
    switch (subcommand) {
      case 'add':
        const key = interaction.options.getString('key')
        const name = interaction.options.getString('name')
        const category = interaction.options.getString('category')
        const ratelimit = interaction.options.getString('ratelimit')
        
        if (settings.apiKeys.some(k => k.key === key) || settings.apiSettings.apikey[key]) {
          await interaction.reply({ content: '❌ API key already exists!', ephemeral: true })
          return
        }
        
        settings.apiKeys.push({ 
          key, 
          name, 
          category,
          ratelimit,
          active: true, 
          createdAt: new Date().toISOString() 
        })
        
        settings.apiSettings.apikey[key] = {
          rateLimit: ratelimit,
          enabled: true,
          category: category,
          name: name
        }
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
        
        const addEmbed = new EmbedBuilder()
          .setTitle('🔑 API Key Added')
          .setColor(0x00ff00)
          .setDescription(`✅ API key **${name}** added successfully!`)
          .addFields(
            { name: 'Category', value: category.charAt(0).toUpperCase() + category.slice(1), inline: true },
            { name: 'Rate Limit', value: ratelimit, inline: true },
            { name: 'Key Preview', value: `\`${key.substring(0, 8)}...\``, inline: true }
          )
          .setTimestamp()
        
        await interaction.reply({ embeds: [addEmbed], ephemeral: true })
        break
        
      case 'delete':
        const keyToDelete = interaction.options.getString('key')
        const keyIndex = settings.apiKeys.findIndex(k => k.key === keyToDelete)
        
        if (keyIndex === -1 && !settings.apiSettings.apikey[keyToDelete]) {
          await interaction.reply({ content: '❌ API key not found!', ephemeral: true })
          return
        }
        
        let deletedKey = null
        if (keyIndex !== -1) {
          deletedKey = settings.apiKeys.splice(keyIndex, 1)[0]
        }
        
        if (settings.apiSettings.apikey[keyToDelete]) {
          if (!deletedKey) {
            deletedKey = {
              name: settings.apiSettings.apikey[keyToDelete].name || 'Unknown',
              key: keyToDelete
            }
          }
          delete settings.apiSettings.apikey[keyToDelete]
        }
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
        
        await interaction.reply({ content: `✅ API key **${deletedKey.name}** deleted successfully!`, ephemeral: true })
        break
        
      case 'toggle':
        const toggleAction = interaction.options.getString('action')
        settings.apiSettings.requireApikey = toggleAction === 'enable'
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
        
        const toggleEmbed = new EmbedBuilder()
          .setTitle('🔧 API Key Requirement')
          .setColor(toggleAction === 'enable' ? 0x00ff00 : 0xff9900)
          .setDescription(`API key requirement has been **${toggleAction === 'enable' ? 'enabled' : 'disabled'}**!`)
          .setTimestamp()
        
        await interaction.reply({ embeds: [toggleEmbed] })
        break
        
      case 'list':
        const allApiKeys = []
        
        settings.apiKeys.forEach(apiKey => {
          allApiKeys.push({
            ...apiKey,
            source: 'array'
          })
        })
        
        Object.entries(settings.apiSettings.apikey).forEach(([key, config]) => {
          if (!settings.apiKeys.some(k => k.key === key)) {
            allApiKeys.push({
              key: key,
              name: config.name || 'Default Key',
              category: config.category || 'default',
              ratelimit: config.rateLimit || 'unlimited',
              active: config.enabled !== false,
              createdAt: 'Default',
              source: 'default'
            })
          }
        })
        
        if (allApiKeys.length === 0) {
          await interaction.reply({ content: '❌ No API keys found!', ephemeral: true })
          return
        }
        
        const embed = new EmbedBuilder()
          .setTitle('🔑 API Keys List')
          .setColor(0x0099ff)
          .setDescription(`Found **${allApiKeys.length}** API key(s)`)
          .setTimestamp()
        
        allApiKeys.forEach((apiKey, index) => {
          const categoryEmoji = {
            'free': '🆓',
            'premium': '⭐',
            'vip': '💎',
            'admin': '👑',
            'default': '🔧'
          }[apiKey.category] || '❓'
          
          embed.addFields({
            name: `${index + 1}. ${categoryEmoji} ${apiKey.name}`,
            value: `**Key:** \`${apiKey.key.substring(0, 8)}...\`\n**Category:** ${apiKey.category.charAt(0).toUpperCase() + apiKey.category.slice(1)}\n**Rate Limit:** ${apiKey.ratelimit}\n**Status:** ${apiKey.active ? '✅ Active' : '❌ Inactive'}\n**Created:** ${apiKey.createdAt}\n**Source:** ${apiKey.source === 'default' ? 'Default' : 'Custom'}`,
            inline: false
          })
        })
        
        await interaction.reply({ embeds: [embed], ephemeral: true })
        break
    }
  } catch (error) {
    console.error('Error handling API key command:', error)
    await interaction.reply({ content: '❌ Error managing API keys.', ephemeral: true })
  }
}

async function handleEndpoint(interaction) {
  const subcommand = interaction.options.getSubcommand()
  
  try {
    switch (subcommand) {
      case 'add':
        await handleAddEndpoint(interaction)
        break
      case 'delete':
        await handleDeleteEndpoint(interaction)
        break
      case 'list':
        await handleListEndpoints(interaction)
        break
      case 'scan':
        await handleScanEndpoints(interaction)
        break
    }
  } catch (error) {
    console.error('Error handling endpoint command:', error)
    await interaction.reply({ content: '❌ Error managing endpoints.', ephemeral: true })
  }
}

async function handleAddEndpoint(interaction) {
  const name = interaction.options.getString('name')
  const filename = interaction.options.getString('filename')
  const category = interaction.options.getString('category')
  const method = interaction.options.getString('method')
  const description = interaction.options.getString('description') || `API endpoint for ${name}`
  const parameters = interaction.options.getString('parameters') || ''
  const optionalParameters = interaction.options.getString('optional_parameters') || ''
  
  if (!/^[a-zA-Z0-9-_]+$/.test(filename)) {
    await interaction.reply({ 
      content: '❌ Invalid filename! Only letters, numbers, hyphens, and underscores are allowed.', 
      ephemeral: true 
    })
    return
  }
  
  try {
    const apiFolder = path.join(__dirname, 'api')
    const categoryFolder = path.join(apiFolder, category)
    const fileName = `${filename}.js`
    const filePath = path.join(categoryFolder, fileName)
    
    if (!fs.existsSync(categoryFolder)) {
      fs.mkdirSync(categoryFolder, { recursive: true })
    }
    
    if (fs.existsSync(filePath)) {
      await interaction.reply({ 
        content: `❌ Endpoint **${filename}** already exists in category **${category}**!`, 
        ephemeral: true 
      })
      return
    }
    
    const endpointTemplate = generateEndpointTemplate(filename, category, method, description, parameters, optionalParameters)
    
    fs.writeFileSync(filePath, endpointTemplate)
    
    await updateSettingsWithEndpoint(name, filename, category, method, description, parameters, optionalParameters)
    
    const embed = new EmbedBuilder()
      .setTitle('🚀 Endpoint Created')
      .setColor(0x00ff00)
      .setDescription(`✅ API endpoint **${name}** created successfully!`)
      .addFields(
        { name: 'Display Name', value: name, inline: true },
        { name: 'Filename', value: filename, inline: true },
        { name: 'Category', value: category.charAt(0).toUpperCase() + category.slice(1), inline: true },
        { name: 'Method', value: method, inline: true },
        { name: 'Path', value: `/${category}/${filename}`, inline: true },
        { name: 'File', value: `src/api/${category}/${fileName}`, inline: true },
        { name: 'Description', value: description, inline: false }
      )
      .setTimestamp()
    
    if (parameters) {
      embed.addFields({ name: 'Required Parameters', value: parameters, inline: false })
    }
    
    if (optionalParameters) {
      embed.addFields({ name: 'Optional Parameters', value: optionalParameters, inline: false })
    }
    
    await interaction.reply({ embeds: [embed] })
    
  } catch (error) {
    console.error('Error creating endpoint:', error)
    await interaction.reply({ 
      content: `❌ Error creating endpoint: ${error.message}`, 
      ephemeral: true 
    })
  }
}

async function handleDeleteEndpoint(interaction) {
  const name = interaction.options.getString('name')
  const category = interaction.options.getString('category')
  
  try {
    const apiFolder = path.join(__dirname, 'api')
    const categoryFolder = path.join(apiFolder, category)
    const fileName = `${name}.js`
    const filePath = path.join(categoryFolder, fileName)
    
    if (!fs.existsSync(filePath)) {
      await interaction.reply({ 
        content: `❌ Endpoint **${name}** not found in category **${category}**!`, 
        ephemeral: true 
      })
      return
    }
    
    fs.unlinkSync(filePath)
    
    await removeEndpointFromSettings(name, category)
    
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Endpoint Deleted')
      .setColor(0xff0000)
      .setDescription(`✅ API endpoint **${name}** deleted successfully!`)
      .addFields(
        { name: 'Category', value: category.charAt(0).toUpperCase() + category.slice(1), inline: true },
        { name: 'Path', value: `/${category}/${name}`, inline: true },
        { name: 'File', value: `src/api/${category}/${fileName}`, inline: false }
      )
      .setTimestamp()
    
    await interaction.reply({ embeds: [embed] })
    
  } catch (error) {
    console.error('Error deleting endpoint:', error)
    await interaction.reply({ 
      content: `❌ Error deleting endpoint: ${error.message}`, 
      ephemeral: true 
    })
  }
}

async function handleListEndpoints(interaction) {
  try {
    const apiFolder = path.join(__dirname, 'api')
    const endpoints = []
    
    if (fs.existsSync(apiFolder)) {
      const categories = fs.readdirSync(apiFolder)
      
      for (const category of categories) {
        const categoryPath = path.join(apiFolder, category)
        if (fs.statSync(categoryPath).isDirectory()) {
          const files = fs.readdirSync(categoryPath)
          const jsFiles = files.filter(file => file.endsWith('.js'))
          
          for (const file of jsFiles) {
            const endpointName = path.basename(file, '.js')
            endpoints.push({
              name: endpointName,
              category: category,
              path: `/${category}/${endpointName}`,
              file: `src/api/${category}/${file}`
            })
          }
        }
      }
    }
    
    if (endpoints.length === 0) {
      await interaction.reply({ 
        content: '❌ No endpoints found!', 
        ephemeral: true 
      })
      return
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🚀 Available API Endpoints')
      .setColor(0x0099ff)
      .setDescription(`Found **${endpoints.length}** endpoint(s)`)
      .setTimestamp()
    
    const groupedEndpoints = {}
    endpoints.forEach(endpoint => {
      if (!groupedEndpoints[endpoint.category]) {
        groupedEndpoints[endpoint.category] = []
      }
      groupedEndpoints[endpoint.category].push(endpoint)
    })
    
    Object.entries(groupedEndpoints).forEach(([category, categoryEndpoints]) => {
      const categoryEmoji = {
        'ai': '🤖',
        'maker': '🛠️',
        'random': '🎲',
        'tools': '🔧',
        'games': '🎮',
        'social': '👥',
        'news': '📰',
        'custom': '⚙️'
      }[category] || '📁'
      
      const endpointList = categoryEndpoints.map(ep => 
        `• **${ep.name}** - \`${ep.path}\``
      ).join('\n')
      
      embed.addFields({
        name: `${categoryEmoji} ${category.charAt(0).toUpperCase() + category.slice(1)} (${categoryEndpoints.length})`,
        value: endpointList,
        inline: false
      })
    })
    
    await interaction.reply({ embeds: [embed] })
    
  } catch (error) {
    console.error('Error listing endpoints:', error)
    await interaction.reply({ 
      content: '❌ Error listing endpoints.', 
      ephemeral: true 
    })
  }
}

async function handleScanEndpoints(interaction) {
  try {
    const apiFolder = path.join(__dirname, 'api')
    const scanResults = []
    
    if (fs.existsSync(apiFolder)) {
      const categories = fs.readdirSync(apiFolder)
      
      for (const category of categories) {
        const categoryPath = path.join(apiFolder, category)
        if (fs.statSync(categoryPath).isDirectory()) {
          const files = fs.readdirSync(categoryPath)
          const jsFiles = files.filter(file => file.endsWith('.js'))
          
          scanResults.push({
            category: category,
            count: jsFiles.length,
            files: jsFiles
          })
        }
      }
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🔍 API Structure Scan')
      .setColor(0x0099ff)
      .setDescription('Detected API folder structure:')
      .setTimestamp()
    
    if (scanResults.length === 0) {
      embed.setDescription('No API categories found!')
    } else {
      scanResults.forEach(result => {
        const categoryEmoji = {
          'ai': '🤖',
          'maker': '🛠️',
          'random': '🎲',
          'tools': '🔧',
          'games': '🎮',
          'social': '👥',
          'news': '📰',
          'custom': '⚙️'
        }[result.category] || '📁'
        
        const fileList = result.files.length > 0 
          ? result.files.map(f => `\`${f}\``).join(', ')
          : 'No files'
        
        embed.addFields({
          name: `${categoryEmoji} ${result.category.charAt(0).toUpperCase() + result.category.slice(1)} (${result.count} files)`,
          value: fileList,
          inline: false
        })
      })
    }
    
    await interaction.reply({ embeds: [embed] })
    
  } catch (error) {
    console.error('Error scanning endpoints:', error)
    await interaction.reply({ 
      content: '❌ Error scanning API structure.', 
      ephemeral: true 
    })
  }
}

async function updateSettingsWithEndpoint(name, filename, category, method, description, parameters, optionalParameters) {
  try {
    const settingsPath = path.join(__dirname, 'settings.json')
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    
    const categoryDisplayNames = {
      'ai': 'Artificial Intelligence',
      'maker': 'Image Makers',
      'random': 'Random Images',
      'tools': 'Tools',
      'games': 'Games',
      'social': 'Social',
      'news': 'News',
      'custom': 'Custom'
    }
    
    const categoryDisplayName = categoryDisplayNames[category] || category.charAt(0).toUpperCase() + category.slice(1)
    
    const paramObj = {}
    if (parameters) {
      const paramList = parameters.split(',').map(p => p.trim())
      paramList.forEach(param => {
        paramObj[param] = `Required: Description for ${param} parameter`
      })
    }
    
    if (optionalParameters) {
      const optionalParamList = optionalParameters.split(',').map(p => p.trim())
      optionalParamList.forEach(param => {
        paramObj[param] = `Optional: Description for ${param} parameter`
      })
    }
    
    const allParams = []
    if (parameters) allParams.push(...parameters.split(',').map(p => p.trim() + '='))
    if (optionalParameters) allParams.push(...optionalParameters.split(',').map(p => p.trim() + '='))
    const endpointPath = `/${category}/${filename}${allParams.length > 0 ? '?' + allParams.join('&') : ''}`
    
    let categoryIndex = settings.categories.findIndex(cat => cat.name === categoryDisplayName)
    if (categoryIndex === -1) {
      settings.categories.push({
        name: categoryDisplayName,
        items: []
      })
      categoryIndex = settings.categories.length - 1
    }
    
    settings.categories[categoryIndex].items.push({
      name: name,
      desc: description,
      path: endpointPath,
      status: "ready",
      params: paramObj
    })
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    
  } catch (error) {
    console.error('Error updating settings.json:', error)
    throw error
  }
}

async function removeEndpointFromSettings(filename, category) {
  try {
    const settingsPath = path.join(__dirname, 'settings.json')
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    
    const categoryDisplayNames = {
      'ai': 'Artificial Intelligence',
      'maker': 'Image Makers',
      'random': 'Random Images',
      'tools': 'Tools',
      'games': 'Games',
      'social': 'Social',
      'news': 'News',
      'custom': 'Custom'
    }
    
    const categoryDisplayName = categoryDisplayNames[category] || category.charAt(0).toUpperCase() + category.slice(1)
    
    const categoryIndex = settings.categories.findIndex(cat => cat.name === categoryDisplayName)
    if (categoryIndex !== -1) {
      const itemIndex = settings.categories[categoryIndex].items.findIndex(item => 
        item.path.includes(`/${category}/${filename}`)
      )
      if (itemIndex !== -1) {
        settings.categories[categoryIndex].items.splice(itemIndex, 1)
        
        if (settings.categories[categoryIndex].items.length === 0) {
          settings.categories.splice(categoryIndex, 1)
        }
      }
    }
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    
  } catch (error) {
    console.error('Error removing endpoint from settings.json:', error)
    throw error
  }
}

function generateEndpointTemplate(name, category, method, description, parameters, optionalParameters) {
  const paramList = parameters ? parameters.split(',').map(p => p.trim()) : []
  const optionalParamList = optionalParameters ? optionalParameters.split(',').map(p => p.trim()) : []
  const allParamList = [...paramList, ...optionalParamList]
  
  const paramValidation = paramList.map(param => 
    `      if (!${param}) {
      return res.status(400).json({ 
        status: false, 
        error: "${param} is required" 
      })
    }`
  ).join('\n')
  
  const paramUsage = allParamList.map(param => 
    `      const ${param} = req.${method === 'GET' ? 'query' : 'body'}.${param}`
  ).join('\n')
  const paramExamples = paramList.map(param => {
    const examples = {
      'text': 'Hello World',
      'message': 'Hello World',
      'query': 'search term',
      'limit': '10',
      'count': '5',
      'id': '123',
      'url': 'https://example.com',
      'email': 'user@example.com',
      'username': 'john_doe',
      'password': 'secure_password',
      'token': 'your_token_here',
      'key': 'your_key_here',
      'data': 'your_data_here',
      'content': 'your_content_here',
      'value': 'your_value_here',
      'input': 'your_input_here',
      'output': 'your_output_here',
      'result': 'your_result_here',
      'response': 'your_response_here',
      'status': 'active',
      'type': 'text',
      'format': 'json',
      'size': 'medium',
      'color': 'blue',
      'theme': 'dark',
      'mode': 'production',
      'version': '1.0',
      'language': 'en',
      'country': 'US',
      'timezone': 'UTC',
      'date': '2024-01-01',
      'time': '12:00:00',
      'duration': '60',
      'interval': '30',
      'frequency': 'daily',
      'priority': 'high',
      'level': 'info',
      'category': 'general',
      'tag': 'important',
      'label': 'main',
      'title': 'Sample Title',
      'description': 'Sample Description',
      'name': 'Sample Name',
      'author': 'John Doe',
      'source': 'api',
      'target': 'database',
      'action': 'create',
      'operation': 'read',
      'command': 'execute',
      'function': 'process',
      'method': 'POST',
      'endpoint': '/api/example',
      'path': '/example',
      'route': '/example',
      'url': 'https://api.example.com',
      'host': 'api.example.com',
      'port': '3000',
      'protocol': 'https',
      'domain': 'example.com',
      'subdomain': 'api',
      'prefix': 'v1',
      'suffix': 'json',
      'extension': '.js',
      'filename': 'example.js',
      'directory': '/api',
      'folder': 'endpoints',
      'file': 'example.js',
      'config': '{"key": "value"}',
      'options': '{"option1": true}',
      'settings': '{"setting1": "value1"}',
      'preferences': '{"pref1": "value1"}',
      'parameters': '{"param1": "value1"}',
      'arguments': '["arg1", "arg2"]',
      'flags': '["--verbose", "--debug"]',
      'options': '{"option1": true, "option2": false}',
      'filters': '{"filter1": "value1"}',
      'sort': 'name',
      'order': 'asc',
      'direction': 'forward',
      'reverse': 'false',
      'ascending': 'true',
      'descending': 'false',
      'min': '0',
      'max': '100',
      'start': '0',
      'end': '10',
      'begin': '1',
      'finish': '100',
      'first': '0',
      'last': '9',
      'previous': '0',
      'next': '10',
      'before': '2024-01-01',
      'after': '2024-01-02',
      'since': '2024-01-01',
      'until': '2024-12-31',
      'from': '2024-01-01',
      'to': '2024-12-31',
      'beginning': '2024-01-01',
      'ending': '2024-12-31',
      'start_date': '2024-01-01',
      'end_date': '2024-12-31',
      'created_at': '2024-01-01T00:00:00Z',
      'updated_at': '2024-01-01T00:00:00Z',
      'deleted_at': null,
      'published_at': '2024-01-01T00:00:00Z',
      'expires_at': '2024-12-31T23:59:59Z',
      'valid_until': '2024-12-31T23:59:59Z',
      'active_until': '2024-12-31T23:59:59Z',
      'expires_in': '86400',
      'ttl': '3600',
      'timeout': '30',
      'delay': '5',
      'retry': '3',
      'attempts': '5',
      'max_attempts': '10',
      'min_attempts': '1',
      'max_retries': '3',
      'min_retries': '0',
      'retry_delay': '1000',
      'retry_interval': '5000',
      'retry_count': '0',
      'retry_limit': '5',
      'retry_timeout': '30000',
      'retry_backoff': 'exponential',
      'retry_strategy': 'linear',
      'retry_policy': 'fixed',
      'retry_jitter': 'true',
      'retry_max_delay': '60000',
      'retry_min_delay': '1000',
      'retry_factor': '2',
      'retry_multiplier': '1.5',
      'retry_base_delay': '1000',
      'retry_max_interval': '30000',
      'retry_min_interval': '1000',
      'retry_initial_interval': '1000',
      'retry_randomization_factor': '0.1',
      'retry_max_elapsed_time': '300000',
      'retry_max_elapsed_duration': '5m',
      'retry_max_elapsed_seconds': '300',
      'retry_max_elapsed_milliseconds': '300000',
      'retry_max_elapsed_microseconds': '300000000',
      'retry_max_elapsed_nanoseconds': '300000000000',
      'retry_max_elapsed_timeout': '300000',
      'retry_max_elapsed_delay': '300000',
      'retry_max_elapsed_wait': '300000',
      'retry_max_elapsed_sleep': '300000',
      'retry_max_elapsed_pause': '300000',
      'retry_max_elapsed_break': '300000',
      'retry_max_elapsed_stop': '300000',
      'retry_max_elapsed_halt': '300000',
      'retry_max_elapsed_cease': '300000',
      'retry_max_elapsed_terminate': '300000',
      'retry_max_elapsed_finish': '300000',
      'retry_max_elapsed_complete': '300000',
      'retry_max_elapsed_done': '300000',
      'retry_max_elapsed_end': '300000',
      'retry_max_elapsed_conclude': '300000',
      'retry_max_elapsed_close': '300000',
      'retry_max_elapsed_shut': '300000',
      'retry_max_elapsed_lock': '300000',
      'retry_max_elapsed_seal': '300000',
      'retry_max_elapsed_secure': '300000',
      'retry_max_elapsed_fix': '300000',
      'retry_max_elapsed_fasten': '300000',
      'retry_max_elapsed_bind': '300000',
      'retry_max_elapsed_tie': '300000',
      'retry_max_elapsed_attach': '300000',
      'retry_max_elapsed_connect': '300000',
      'retry_max_elapsed_link': '300000',
      'retry_max_elapsed_join': '300000',
      'retry_max_elapsed_unite': '300000',
      'retry_max_elapsed_merge': '300000',
      'retry_max_elapsed_combine': '300000',
      'retry_max_elapsed_mix': '300000',
      'retry_max_elapsed_blend': '300000',
      'retry_max_elapsed_fuse': '300000',
      'retry_max_elapsed_amalgamate': '300000',
      'retry_max_elapsed_consolidate': '300000',
      'retry_max_elapsed_integrate': '300000',
      'retry_max_elapsed_incorporate': '300000',
      'retry_max_elapsed_assimilate': '300000',
      'retry_max_elapsed_absorb': '300000',
      'retry_max_elapsed_engulf': '300000',
      'retry_max_elapsed_swallow': '300000',
      'retry_max_elapsed_consume': '300000',
      'retry_max_elapsed_devour': '300000',
      'retry_max_elapsed_ingest': '300000',
      'retry_max_elapsed_intake': '300000',
      'retry_max_elapsed_imbibe': '300000',
      'retry_max_elapsed_sip': '300000',
      'retry_max_elapsed_slurp': '300000',
      'retry_max_elapsed_gulp': '300000',
      'retry_max_elapsed_swig': '300000',
      'retry_max_elapsed_quaff': '300000',
      'retry_max_elapsed_swill': '300000',
      'retry_max_elapsed_drain': '300000',
      'retry_max_elapsed_empty': '300000',
      'retry_max_elapsed_void': '300000',
      'retry_max_elapsed_clear': '300000',
      'retry_max_elapsed_clean': '300000',
      'retry_max_elapsed_purge': '300000',
      'retry_max_elapsed_flush': '300000',
      'retry_max_elapsed_rinse': '300000',
      'retry_max_elapsed_wash': '300000',
      'retry_max_elapsed_scrub': '300000',
      'retry_max_elapsed_cleanse': '300000',
      'retry_max_elapsed_purify': '300000',
      'retry_max_elapsed_sanitize': '300000',
      'retry_max_elapsed_sterilize': '300000',
      'retry_max_elapsed_disinfect': '300000',
      'retry_max_elapsed_decontaminate': '300000',
      'retry_max_elapsed_detoxify': '300000',
      'retry_max_elapsed_detox': '300000',
      'retry_max_elapsed_cleanse': '300000',
      'retry_max_elapsed_purify': '300000',
      'retry_max_elapsed_sanitize': '300000',
      'retry_max_elapsed_sterilize': '300000',
      'retry_max_elapsed_disinfect': '300000',
      'retry_max_elapsed_decontaminate': '300000',
      'retry_max_elapsed_detoxify': '300000',
      'retry_max_elapsed_detox': '300000'
    }
    
    return examples[param.toLowerCase()] || `example_${param}`
  })
  
  return `import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.${method.toLowerCase()}("/${category}/${name}", createApiKeyMiddleware(), async (req, res) => {
    try {
${paramUsage}
      
${paramValidation}
      
      res.status(200).json({
        status: true,
        message: "${description}",
        endpoint: "/${category}/${name}",
        method: "${method}",
        required_parameters: {
          ${paramList.map((param, index) => `"${param}": "${paramExamples[index]}"`).join(',\n          ')}
        },
        ${optionalParamList.length > 0 ? `optional_parameters: {
          ${optionalParamList.map(param => `"${param}": "example_${param}"`).join(',\n          ')}
        },` : ''}
        example: {
          url: "https://your-domain.com/${category}/${name}${allParamList.length > 0 ? '?' + allParamList.map(p => `${p}=${paramList.includes(p) ? paramExamples[paramList.indexOf(p)] : `example_${p}`}`).join('&') : ''}",
          method: "${method}",
          ${method === 'GET' ? 'query' : 'body'}: {
            ${allParamList.map((param, index) => `"${param}": "${paramList.includes(param) ? paramExamples[paramList.indexOf(param)] : `example_${param}`}"`).join(',\n            ')}
          }
        }
      })
      
    } catch (error) {
      console.error("${category}/${name} API Error:", error)
      res.status(500).json({ 
        status: false, 
        error: error.message || "Internal server error" 
      })
    }
  })
}`
}

export function startDiscordBot() {
  if (!process.env.DISCORD_TOKEN) {
    setTimeout(() => {
      console.log('Discord token not found. Skipping Discord bot initialization.')
    }, 1000)
    return
  }

  client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login to Discord:', error)
  })
}

export { updateStats }

export default client