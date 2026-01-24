import postgres from "postgres"
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
const channels = await sql`SELECT id FROM channels`
// await leaveChannelAll(channelId)
// Deno.exit(0)
async function updateChannel(id: string) {
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
}
channels.forEach(async (channel) => {
    await updateChannel(channel.id)
})
