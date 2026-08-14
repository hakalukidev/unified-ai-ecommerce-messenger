import { env } from "@/lib/env";
import Pusher from "pusher-js";

let pusherClient: Pusher | null | undefined;

export const getPusherClient = () => {
  if (pusherClient !== undefined) {
    return pusherClient;
  }

  if (typeof window === "undefined" || !env.pusherKey) {
    pusherClient = null;
    return pusherClient;
  }

  pusherClient = new Pusher(env.pusherKey, {
    cluster: env.pusherCluster,
  });

  return pusherClient;
};
