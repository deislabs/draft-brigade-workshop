# Inner loop development with Brigade

In this section we will explore using Brigade to create an _inner loop_ development workflow - that builds a container image, updates the deployment and runs tests in the cluster, all before pushing to source control, all in the background, transparent to the developer.

## Getting started with Brigade

First of all, it is recommended to follow [the Brigade Overview document][brigade-overview] to familiarize yourself with the concepts Brigade introduces, then follow the quick install guide to deploy Brigade into your Kubernetes cluster.

> By default, Brigade deploys a a public gateway to connect to GitHub. For the purpose of this demo, we can disable this component, as we will not be pushing to GitHub (or any version control) in this demo.

> If you are running inside Minikube, or Docker Desktop, a load balancer service will not have a public IP, so trying to expose services on the Internet will fail. This is why we will not use a public gateway for this demo.

> By default, Brigade is deployed with RBAC disabled - if your cluster has RBAC enabled, make sure to pass the `--set rbac.enabled=true` flag to `helm install`.

An example of how the Helm install command would look like:

```
$ helm install -n brigade ./charts/brigade --set rbac.enabled=true --set gw.enabled=false
```

## Creating a new Brigade project

Now it's time to use `brig`, the CLI for Brigade, to create a new project. By default, a new Brigade project will use a VCS sidecar that clones the project git repository so that the Brigade worker (the container that executes the JavaScript pipeline) has your project locally. But because in this case we are not pushing to git, we will want to use a different sidecar, one that only copies the `brigade.js` file in the Brigade workspace (and then will use the newly built image to test everything.)


> Note that we could skip adding a sidecar altogether since we supply the `brigade.js` file with `brig run` - however, because of a known bug in Brigade, that is currently unavailable, so we can bypass that by using an `alpine` container for it, wihch, in this case, is the equivalent of not using one.


```
$ brig project create
? Project name radu-matei/node-demo
? Full repository name github.com/radu-matei/node-demo
? Clone URL (https://github.com/your/repo.git) [? for help] (https://github.com/radu-matei/d? Clone URL (https://github.com/your/repo.git) https://github.com/radu-matei/node-demo.git
? Add secrets? No
Auto-generated a Shared Secret: "Cmwbe42gh1P3gD9ShFB3ANM9"
? Configure GitHub Access? No
? Configure advanced options Yes
? Custom VCS sidecar alpine
? Build storage size 
? Build storage class 
? Job cache storage class 
? Worker image registry or DockerHub org 
? Worker image name 
? Custom worker image tag 
? Worker image pull policy IfNotPresent
? Worker command yarn -s start
? Initialize Git submodules No
? Allow host mounts No
? Allow privileged jobs Yes
? Image pull secrets 
? Default script ConfigMap name 
? Upload a default brigade.js script 
Project ID: brigade-646bf4e98239dcddf6f67ba3df7a407bba9018c66e71a369ad62ef
```

Then, we will use [this application][app] to go through working with Draft and Brigade to create a development workflow.


[brigade-overview]: https://azure.github.io/brigade/intro/overview.html
[quick-install]: https://azure.github.io/brigade/intro/install.html

[app]: https://github.com/radu-matei/node-demo