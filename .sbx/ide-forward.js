const net = require('net')

// Forward sandbox 127.0.0.1:<port> to the host editor's loopback WS at the same
// port. The sandbox reaches the host only through its egress proxy, so tunnel via
// HTTP CONNECT to host.docker.internal (which the proxy maps to the host loopback).
const port = parseInt(process.argv[2], 10)
const proxyUrl =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    'http://gateway.docker.internal:3128'
const proxy = new URL(proxyUrl)
const proxyHost = proxy.hostname || 'gateway.docker.internal'
const proxyPort = parseInt(proxy.port, 10) || 3128
const target = `host.docker.internal:${port}`

function handle(client) {
    const upstream = net.connect(proxyPort, proxyHost)
    let header = Buffer.alloc(0)
    let tunneled = false

    const onHeader = (chunk) => {
        header = Buffer.concat([header, chunk])
        const end = header.indexOf('\r\n\r\n')
        if (end === -1) {
            return
        }
        const status = header.subarray(0, header.indexOf('\r\n')).toString()
        if (!status.includes(' 200 ')) {
            client.destroy()
            upstream.destroy()
            return
        }
        tunneled = true
        upstream.removeListener('data', onHeader)
        const rest = header.subarray(end + 4) // bytes after the CONNECT response are tunnel data
        if (rest.length) {
            client.write(rest)
        }
        client.pipe(upstream)
        upstream.pipe(client)
    }

    upstream.on('connect', () => {
        upstream.write(`CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\n\r\n`)
        upstream.on('data', onHeader)
    })
    const cleanup = () => {
        client.destroy()
        upstream.destroy()
    }
    client.on('error', cleanup)
    upstream.on('error', cleanup)
    client.on('close', () => {
        if (!tunneled) {
            upstream.destroy()
        }
    })
}

const server = net.createServer(handle)
server.on('error', (e) => {
    process.stderr.write(String(e) + '\n')
    process.exit(1)
})
server.listen(port, '127.0.0.1')
