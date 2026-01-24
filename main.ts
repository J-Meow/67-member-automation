import postgres from "postgres"
import { createHmac } from "node:crypto"
const sql = postgres()
const edgeNodeId = "E09V59WQY1E"
const tokenFile = await Deno.readTextFile(Deno.env.get("TOKEN_FILE_PATH")!)
const tokens: { xoxc: string; xoxd: string }[] = []
tokenFile
    .split("\n")
    .slice(0, -1)
    .forEach((line) => {
        const values = line.split(" ")
        tokens[parseInt(values[0])] = { xoxc: values[2], xoxd: values[3] }
    })
const doTokenCheck = false
for (let i = 1; i <= 99 && doTokenCheck; i++) {
    try {
        const userBootResponse = await (
            await fetch(
                "https://hackclub.enterprise.slack.com/api/client.userBoot",
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data; boundary=----boundary",
                        Cookie: "d=" + tokens[i].xoxd,
                    },
                    body:
                        '------boundary\r\nContent-Disposition: form-data; name="token"\r\n\r\n' +
                        tokens[i].xoxc +
                        "\r\n------boundary--\r\n",
                    method: "POST",
                },
            )
        ).json()
        if (!userBootResponse.ok) {
            throw new Error("errorrr")
        }
        console.log(i + " token check successful")
    } catch (_) {
        throw new Error("invalid tokens for id " + i)
    }
}
async function leaveChannelAll(id: string) {
    for (let i = 1; i <= 99; i++) {
        console.log(
            await (
                await fetch(
                    "https://hackclub.enterprise.slack.com/api/conversations.leave",
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data; boundary=----boundary",
                            Cookie: "d=" + tokens[i].xoxd,
                        },
                        body:
                            '------boundary\r\nContent-Disposition: form-data; name="token"\r\n\r\n' +
                            tokens[i].xoxc +
                            '\r\n------boundary\r\nContent-Disposition: form-data; name="channel"\r\n\r\n' +
                            id +
                            "\r\n------boundary--\r\n",
                        method: "POST",
                    },
                )
            ).json(),
        )
        console.log(i + " left channel " + id)
    }
}
async function leaveChannel(id: string, botId: number) {
    console.log(
        await (
            await fetch(
                "https://hackclub.enterprise.slack.com/api/conversations.leave",
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data; boundary=----boundary",
                        Cookie: "d=" + tokens[botId].xoxd,
                    },
                    body:
                        '------boundary\r\nContent-Disposition: form-data; name="token"\r\n\r\n' +
                        tokens[botId].xoxc +
                        '\r\n------boundary\r\nContent-Disposition: form-data; name="channel"\r\n\r\n' +
                        id +
                        "\r\n------boundary--\r\n",
                    method: "POST",
                },
            )
        ).json(),
    )
}
async function joinChannel(id: string, botId: number) {
    console.log(
        await (
            await fetch(
                "https://hackclub.enterprise.slack.com/api/conversations.join",
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data; boundary=----boundary",
                        Cookie: "d=" + tokens[botId].xoxd,
                    },
                    body:
                        '------boundary\r\nContent-Disposition: form-data; name="token"\r\n\r\n' +
                        tokens[botId].xoxc +
                        '\r\n------boundary\r\nContent-Disposition: form-data; name="channel"\r\n\r\n' +
                        id +
                        "\r\n------boundary--\r\n",
                    method: "POST",
                },
            )
        ).json(),
    )
    console.log(botId + " joined channel " + id)
}
async function getChannelMemberCount(id: string) {
    const response = await (
        await fetch(
            "https://edgeapi.slack.com/cache/" + edgeNodeId + "/users/counts",
            {
                headers: {
                    "Content-Type": "text/plain;charset=UTF-8",
                    Cookie: "d=" + tokens[1].xoxd,
                },
                body: JSON.stringify({
                    token: tokens[1].xoxc,
                    channel: id,
                    as_admin: false,
                    enterprise_token: tokens[1].xoxc,
                }),
                method: "POST",
            },
        )
    ).json()
    return response.counts.people
}
async function requiredMemberCountChange(id: string) {
    return 67 - (await getChannelMemberCount(id))
}
async function checkIfChannelMember(id: string, botId: number) {
    return (
        await (
            await fetch(
                "https://hackclub.enterprise.slack.com/api/conversations.info",
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data; boundary=----boundary",
                        Cookie: "d=" + tokens[botId].xoxd,
                    },
                    body:
                        '------boundary\r\nContent-Disposition: form-data; name="token"\r\n\r\n' +
                        tokens[botId].xoxc +
                        '\r\n------boundary\r\nContent-Disposition: form-data; name="channel"\r\n\r\n' +
                        id +
                        "\r\n------boundary--\r\n",
                    method: "POST",
                },
            )
        ).json()
    ).channel.is_member
}
async function botMembersOfChannel(id: string) {
    const members = []
    for (let i = 1; i <= 99; i++) {
        if (await checkIfChannelMember(id, i)) {
            members.push(i)
        }
    }
    return members
}
// await leaveChannelAll(channelId)
// Deno.exit(0)
const processingChannels: string[] = []
async function updateChannel(id: string) {
    processingChannels.push(id)
    console.log(`Starting channel update in ${id}`)
    const botMembers = await botMembersOfChannel(id)
    let toAdd = await requiredMemberCountChange(id)
    while (
        toAdd < 0 &&
        -toAdd > botMembers.filter((x) => typeof x == "number").length
    ) {
        toAdd += 100
    }
    console.log(`Changing member count in ${id} by ${toAdd}`)
    if (toAdd > 0) {
        let skipped = 0
        for (let i = 1; i <= toAdd; i++) {
            while (botMembers.includes(i + skipped)) skipped++
            await joinChannel(id, i + skipped)
            console.log("Bot #" + (i + skipped) + " joining channel " + id)
        }
    } else if (toAdd < 0) {
        for (let i = 1; i <= -toAdd && botMembers.length; i++) {
            const botLeaving =
                botMembers[Math.floor(Math.random() * botMembers.length)]
            await leaveChannel(id, botLeaving)
            console.log("Bot #" + botLeaving + " leaving channel " + id)
            botMembers.splice(botMembers.indexOf(botLeaving), 1)
        }
    }
    processingChannels.splice(processingChannels.indexOf(id), 1)
}
async function update() {
    const channels = await sql`SELECT id FROM channels`
    channels.forEach(async (channel) => {
        await updateChannel(channel.id)
    })
}
const slackSigningSecret = Deno.env.get("SLACK_SIGNING_SECRET")!
Deno.serve({ port: 11205 }, async (req: Request) => {
    const body = await req.text()
    if (
        (new URL(req.url).pathname == "/command" ||
            new URL(req.url).pathname == "/events") &&
        req.method == "POST"
    ) {
        const timestamp = req.headers.get("x-slack-request-timestamp")!
        const signature = req.headers.get("x-slack-signature")!
        if (!timestamp || !signature) {
            return new Response(null, { status: 400 })
        }
        if (
            Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp)) >
            60 * 5
        ) {
            return new Response(null, { status: 400 })
        }
        const signString = `v0:${timestamp}:${body}`
        const hmac = createHmac("sha256", slackSigningSecret)
        hmac.update(signString)
        const hashedSignString = hmac.digest("hex")
        const correctSignature = "v0=" + hashedSignString
        if (correctSignature != signature) {
            return new Response(null, { status: 400 })
        }
    }
    if (new URL(req.url).pathname == "/events" && req.method == "POST") {
        const json = JSON.parse(body)
        if (json.type == "url_verification") {
            console.log("Slack verification success")
            return new Response(json.challenge)
        }
        if (json.type == "event_callback") {
            const event = json.event
            if (
                (event.type == "member_joined_channel" ||
                    event.type == "member_left_channel") &&
                !processingChannels.includes(event.channel)
            ) {
                const channels =
                    await sql`SELECT id FROM channels WHERE id=${event.channel}`
                if (channels.count) {
                    console.log("New member in " + event.channel + ", updating")
                    updateChannel(event.channel)
                }
            }
        }
        console.log(json)
        console.log(processingChannels)
        return new Response()
    }
    if (new URL(req.url).pathname == "/command" && req.method == "POST") {
        const formData = new URLSearchParams(body)
        const text = formData.get("text")
        const channelId = formData.get("channel_id")
        const userId = formData.get("user_id")
        console.log(userId)
        const channelInfo = await (
            await fetch(
                "https://slack.com/api/conversations.info?channel=" +
                    encodeURIComponent(channelId!),
                {
                    headers: {
                        authorization:
                            "Bearer " + Deno.env.get("SLACK_BOT_XOXB"),
                    },
                },
            )
        ).json()
        if (
            channelInfo.channel.creator != userId &&
            userId != Deno.env.get("ADMIN_SLACK_ID")
        ) {
            console.log(
                userId +
                    " attempted to run command in " +
                    channelId +
                    " and was blocked",
            )
            return new Response(
                "As you are not the creator of this channel, you are not allowed to use this bot. Please ask <@" +
                    channelInfo.channel.creator +
                    "> (the creator of the channel) or <@" +
                    Deno.env.get("ADMIN_SLACK_ID") +
                    "> (the creator of the bot) if you'd like to use it.",
            )
        }
        switch (text) {
            case "enable":
                console.log(`Adding ${channelId} to 67ish channels`)
                try {
                    await sql`INSERT INTO channels VALUES (${channelId})`
                    update()
                    return new Response(
                        "Success, this channel will have 67 members shortly.",
                    )
                } catch (err) {
                    console.error(err)
                    return new Response("Channel is already enabled!")
                }
            case "disable":
                console.log(`Removing ${channelId} from 67ish channels`)
                await sql`DELETE FROM channels WHERE ID=${channelId}`
                return new Response(
                    "Success, this channel will no longer automatically update to have 67 members. If you'd like the alt accounts to leave, run `/67members leave`.\n(This message shows even if the bot wasn't enabled in the first place)",
                )
            case "leave":
                console.log(`Removing alts from ${channelId}`)
                await sql`DELETE FROM channels WHERE ID=${channelId}`
                leaveChannelAll(channelId!)
                return new Response("Alt accounts leaving.")
            case "update":
                console.log(`Updating count in ${channelId}`)
                if (
                    (await sql`SELECT id FROM channels WHERE id=${channelId}`)
                        .count == 0
                ) {
                    return new Response(
                        "Channel is not currently opted into this bot. Please run `/67members enable` to opt in.",
                    )
                }
                updateChannel(channelId!)
                return new Response("Updating member count to 67")
            default:
                return new Response(
                    "Invalid command. Please use `/67members [enable/disable/leave/update]`.",
                )
        }
    }
    return new Response(null, { status: 404 })
})
update()
