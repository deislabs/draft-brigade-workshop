const { events, Job } = require('@azure/brigadier')

events.on("exec", (brigadeEvent, project) => {
    var hello = new Job("linux-job")
    hello.image = "alpine:3.4"
    hello.tasks = ["echo Hello Brigade from Azure"]

    hello.host.name = "virtual-kubelet"
    hello.resourceRequests.cpu = "1"
    hello.resourceRequests.memory = "1G"

    hello.run()
})
