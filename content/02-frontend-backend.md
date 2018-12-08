# Develop frontend and backend apps with Draft

Our scenario is the following: we are working on an Angular front-end that uses a NodeJS back-end, which has to run in the cluster due to some dependencies we cannot or don't want to replicate locally - those can be databases we don't have access to, queues we need to use, or multiple micro-services we simply cannot run locally.

We will use Draft to easily iterate through changes in our back-end, and use the port-forwarding functionality to test our front-end locally, before deploying it in the cluster. We will also see how to use VS Code to experiment with the remote debugging of the NodeJS application deployed to Kubernetes.

> While this article uses Angular and NodeJS, the same tools and thinking can be applied to any front-end + back-end configuration you might have.

[Our starting point is a GitHub repository containing both projects.](https://github.com/radu-matei/angular-todo-app)

> Credits for the Angular application go to [this SitePoint article](https://www.sitepoint.com/angular-rxjs-create-api-service-rest-backend/) which explains how to get started with Angular and RxJS - while we will not get into details, it is a great source if you're getting started with Angular.

Clone the repository and navigate to the folder containing the solution:

```shell
$ git clone https://github.com/radu-matei/angular-todo-app
$ cd angular-todo-app
```

### Deploy the Node back-end


Earlier we were talking about Draft packs, and how to get started with an existing application - this sample is already configured with the Dockerfile and Helm chart required to deploy on Kubernetes - however, you can customize it to your needs and even write your own packs for your team.

> You can find [the pack used for this application in my packs repository](https://github.com/radu-matei/draft-packs/tree/master/packs/node-debug) - the only difference compared to [the official Draft pack for NodeJS](https://github.com/Azure/draft/tree/master/packs/javascript) is that this one exposes an additional port that we will use later for remote debugging, 9229 - more on this later.

Navigate to the `node-backend` folder, and if everything is setup correctly, you should be able to:

```shell
$ draft up
Draft Up Started: 'todos-api'
todos-api: Building Docker Image: SUCCESS ⚓  (1.0020s)
todos-api: Pushing Docker Image: SUCCESS ⚓  (9.0293s)
todos-api: Releasing Application: SUCCESS ⚓  (0.6775s)
todos-api: Build ID: 01CAQQR0K8BH4MES9WFQS0S5RT
Inspect the logs with `draft logs 01CAQQR0K8BH4MES9WFQS0S5RT`
```
Within around 10 seconds, Draft built and pushed my container image, then deployed my application to the Kubernetes cluster. Let's see what our cluster looks like after this operation.

> Note that the first time you build and push the image it might take a little more - this is because Docker doesn't have any layers cached locally.

Under the hood, after pushing the container image, Draft used Helm to deploy the chart:
```shell
$ helm ls
NAME         REVISION     UPDATED                      STATUS       CHART                NAMESPACE
todos-api    1            Tue Apr 10 15:16:14 2018     DEPLOYED     node-debug-v0.1.0    default
```

This resulted in one pod:

```shell
$ kubectl get pods
NAME                                    READY     STATUS    RESTARTS   AGE
todos-api-node-debug-2786020832-qv0pf   1/1       Running   0          2m
```

A deployment:

```shell
$ kubectl get deployments
NAME                   DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
todos-api-node-debug   1         1         1            1           4m
```
And a `ClusterIP` type service:

```shell
$ kubectl get services
NAME                   TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)    AGE
kubernetes             ClusterIP   10.0.0.1      <none>        443/TCP    20d
todos-api-node-debug   ClusterIP   10.0.202.58   <none>        8080/TCP   5m
```

> All the values, cluster types and container ports can be configured in [`/charts/values.yml`](https://github.com/radu-matei/angular-todo-app/blob/draft-app/node-backend/charts/node-debug/values.yaml) and in [`/charts/templates`](https://github.com/radu-matei/angular-todo-app/tree/draft-app/node-backend/charts/node-debug/templates).

Now we can start forwarding the ports exposed by our application locally, and access it as if it were running in a local process:

```shell
$ draft connect
Connect to node-debug:8080 on localhost:8080
Connect to node-debug:9229 on localhost:9229
[node-debug]: > node --inspect index.js
[node-debug]:
[node-debug]: Debugger listening on ws://127.0.0.1:9229/221daeb2-8f1b-4b66-b91d-644628107a09
[node-debug]: For help see https://nodejs.org/en/docs/inspector
[node-debug]: Express server listening on port 8080
```
The logs you see come from the Kubernetes pod we just deployed:

```shell
$ kubectl logs todos-api-node-debug-2786020832-qv0pf
> todo-api@0.0.1 start /usr/src/app> node --inspect index.js
Debugger listening on ws://127.0.0.1:9229/221daeb2-8f1b-4b66-b91d-644628107a09
For help see https://nodejs.org/en/docs/inspector
Express server listening on port 8080
```


Now if you browse to [`http://localhost:8080/todos`](http://localhost:8080/todos) you should be able to navigate through the API we just deployed to Kubernetes.


> You can find settings related to the ports used by `draft connect` in the [`draft.toml` file from the root of the directory](https://github.com/radu-matei/angular-todo-app/blob/draft-app/node-backend/draft.toml), and you can customize on what local ports you want to expose your application.

> Here you can find [information about connecting to your application](https://github.com/Azure/draft/blob/master/docs/reference/dep-007.md).

### Exploring the Angular front-end

Now if we navigate to the `angular-frontend` folder and execute `npm install` and `npm start`:

```shell
$ npm install
$ npm start
> todo-app@0.0.0 start /Users/radu/go/src/github.com/radu-matei/angular-todo-app/angular-client
> ng serve

** NG Live Development Server is running on http://localhost:4200 **
Hash: 6c27ad3a7fc35b2f2fa0
Time: 6869ms
chunk    {0} polyfills.bundle.js, polyfills.bundle.js.map (polyfills) 195 kB {4} [initial] [rendered]
chunk    {1} main.bundle.js, main.bundle.js.map (main) 21.2 kB {3} [initial] [rendered]
chunk    {2} styles.bundle.js, styles.bundle.js.map (styles) 21.6 kB {4} [initial] [rendered]
chunk    {3} vendor.bundle.js, vendor.bundle.js.map (vendor) 2.52 MB [initial] [rendered]
chunk    {4} inline.bundle.js, inline.bundle.js.map (inline) 0 bytes [entry] [rendered]
webpack: Compiled successfully.
```

The front-end is already configured to talk to the back-end on `localhost:8080`, so at this point we can navigate to [`http://localhost:4200`](http://localhost:4200) and start playing around with our application.


You can now modify the Angular application, and the live development server will recompile the application.

But what if you want to make changes to your back-end?

### Updating the back-end

At this point, without Draft, making a change to your back-end would require: manually re-building and pushing the container image, then updating the the Kubernetes manifests with the new image tag, then waiting for your pod to be up and manually forward the port so you can test your front-end again - and if you're rapidly iterating and making small changes, this becomes an incredibly annoying and repetitive task.

Let's make a change to our back-end - if we go to `index.js`, we can see where our `ToDo` items are coming from, and we can add a new entry:

```javascript
const inMemoryTodoDB = [
    { id: 0, title: 'Learn Kubernetes', complete: true },
    { id: 1, title: 'Learn Draft', complete: true },
    { id: 2, title: 'Learn Helm', complete: false },
    { id: 3, title: 'Remote debugging is awesome!', complete: false },
    { id: 4, title: 'It is incredibly easy to update your application', complete: true },
];
```

Now we simply save the file and execute `draft up --auto-connect`:

```shell
$ draft up --auto-connect
Draft Up Started: 'todos-api'
todos-api: Building Docker Image: SUCCESS ⚓  (4.0053s)
todos-api: Pushing Docker Image: SUCCESS ⚓  (16.0338s)
todos-api: Releasing Application: SUCCESS ⚓  (1.2102s)
todos-api: Build ID: 01CAQTGH3JNWB7GQQZFVNR5SFE
Inspect the logs with `draft logs 01CAQTGH3JNWB7GQQZFVNR5SFE`
Connect to node-debug:8080 on localhost:8080
Connect to node-debug:9229 on localhost:9229
[node-debug]:
[node-debug]: > todo-api@0.0.1 start /usr/src/app
[node-debug]: > node --inspect index.js
[node-debug]:
[node-debug]: Debugger listening on ws://127.0.0.1:9229/501876bb-eda4-47b1-8f8c-f4c4dfaf648e
[node-debug]: For help see https://nodejs.org/en/docs/inspector
[node-debug]: Express server listening on port 8080
```

This command executed the `draft up` cycle again (build and push the container image, then update the application in your Kubernetes cluster), then exposed the application ports locally - now simply refresh your application page and you should see the changes.


# Your task

If you add a new item from the front-end, it gets created in the back-end with `id: null` - your task is to fix this (and re-deploy using Draft), then open a pull request on the original repository. Good luck!