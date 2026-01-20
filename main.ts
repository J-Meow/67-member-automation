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
    return 69 - (await getChannelMemberCount(id))
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
const botMembers = await botMembersOfChannel("C0A9KBWRNP7")
// await leaveChannelAll("C0A9KBWRNP7")
const toAdd = await requiredMemberCountChange("C0A9KBWRNP7")
console.log(toAdd)
if (toAdd > 0) {
    for (let i = 1; i <= toAdd; i++) {
        await joinChannel("C0A9KBWRNP7", i)
    }
} else if (toAdd < 0 && botMembers.length) {
    for (let i = 1; i <= -toAdd && botMembers.length; i++) {
        const botLeaving =
            botMembers[Math.floor(Math.random() * botMembers.length)]
        await leaveChannel("C0A9KBWRNP7", botLeaving)
        console.log(botLeaving + " leaving channel")
        botMembers.splice(botMembers.indexOf(botLeaving), 1)
    }
    if (botMembers.length) {
        console.log("Too many members to 69ify")
    }
}
