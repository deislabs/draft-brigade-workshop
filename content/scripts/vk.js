const { events, Job, Group } = require('@azure/brigadier')

const parallelism = 20;

events.on("exec", (brigadeEvent, project) => {

    // Brigade grouping for jobs
    var g = new Group();

    for (i = 0; i < parallelism; i++) {
        var job = new Job(`parallel-countdown-${i}`);
        job.image = "ubuntu";
        job.shell = "bash";
        job.tasks = [
            "for((i=$COUNTDOWN_FROM;i<=$COUNTDOWN_TO;i++)); do echo counting $i; sleep 1;  done"
        ];

        job.env = {
            COUNTDOWN_FROM: (i * 10).toString(),
            COUNTDOWN_TO: (i * 10 + 9).toString()
        };

        job.host.name = "virtual-kubelet";
        job.resourceRequests.cpu = "1";
        job.resourceRequests.memory = "1G";

        g.add(job);
    }

    var seq = new Job("sequential-countdown");
    seq.image = "ubuntu";
    seq.shell = "bash";
    seq.tasks = [
        "for((i=$COUNTDOWN_FROM;i<=$COUNTDOWN_TO;i++)); do echo counting $i; sleep 1;  done"
    ];

    seq.env = {
        COUNTDOWN_FROM: (0).toString(),
        COUNTDOWN_TO: (199).toString()
    };

    seq.host.name = "virtual-kubelet";
    seq.resourceRequests.cpu = "1";
    seq.resourceRequests.memory = "1G";

    g.add(seq);

    // runAll runs all jobs in parallel
    g.runAll();
});
