const tokenFile = await Deno.readTextFile(Deno.env.get("TOKEN_FILE_PATH")!)
const tokens: { xoxc: string; xoxd: string }[] = []
tokenFile
    .split("\n")
    .slice(0, -1)
    .forEach((line) => {
        const values = line.split(" ")
        tokens[parseInt(values[0])] = { xoxc: values[2], xoxd: values[3] }
    })
console.log(tokens)
for (let i = 1; i <= 99; i++) {
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
