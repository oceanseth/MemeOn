import { createActor } from "xstate";
import { expect, test } from "vitest";
import { tierFor } from "../../../shared/tiers";
import type { FriendEntry, Meme } from "../lib/types";
import { tradeProposalPayload, tradesMachine } from "./tradesMachine";

const friendA: FriendEntry = {
  sub: "friend-a",
  name: "Friend A",
  picture: null,
  status: "accepted",
  collectionSize: 1,
  portfolioValue: 1,
};

const friendB: FriendEntry = { ...friendA, sub: "friend-b", name: "Friend B" };

const memeA: Meme = {
  id: "meme-a",
  title: "Meme A",
  description: null,
  mediaType: "image",
  imageUrl: "https://example.test/a.png",
  videoUrl: null,
  tags: [],
  creatorId: "friend-a",
  creatorName: "Friend A",
  ownerId: "friend-a",
  ownerName: "Friend A",
  reshares: 0,
  tierKey: "paper",
  listing: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  tier: tierFor(0),
  value: 1,
  myShares: 10,
};

const memeB: Meme = {
  ...memeA,
  id: "meme-b",
  title: "Meme B",
  ownerId: "friend-b",
  creatorId: "friend-b",
};

test("late compose results from a closed session do not replace a reopened session", () => {
  const actor = createActor(tradesMachine).start();

  actor.send({ type: "OPEN_COMPOSE" });
  const generationA = actor.getSnapshot().context.composeGeneration;
  actor.send({ type: "CLOSE_COMPOSE" });
  actor.send({
    type: "SET_FRIENDS",
    friends: [friendA],
    composeGeneration: generationA,
  });
  actor.send({
    type: "SET_BINDER",
    binder: [memeA],
    composeGeneration: generationA,
  });
  actor.send({
    type: "SET_ALL_MEMES",
    memes: [memeA],
    composeGeneration: generationA,
  });
  actor.send({ type: "OPEN_COMPOSE" });
  const generationB = actor.getSnapshot().context.composeGeneration;
  actor.send({
    type: "SET_FRIENDS",
    friends: [friendB],
    composeGeneration: generationB,
  });
  actor.send({
    type: "SET_BINDER",
    binder: [memeB],
    composeGeneration: generationB,
  });
  actor.send({
    type: "SET_ALL_MEMES",
    memes: [memeB],
    composeGeneration: generationB,
  });

  actor.send({
    type: "SET_FRIENDS",
    friends: [friendA],
    composeGeneration: generationA,
  });
  actor.send({
    type: "SET_BINDER",
    binder: [memeA],
    composeGeneration: generationA,
  });
  actor.send({
    type: "SET_ALL_MEMES",
    memes: [memeA],
    composeGeneration: generationA,
  });

  const context = actor.getSnapshot().context;
  expect(context.friends).toEqual([friendB]);
  expect(context.binder).toEqual([memeB]);
  expect(context.allMemes).toEqual([memeB]);
  actor.stop();
});

test("opening clears old options and an ordinary current-session completion closes the composer", () => {
  const actor = createActor(tradesMachine).start();

  actor.send({ type: "OPEN_COMPOSE" });
  const generation = actor.getSnapshot().context.composeGeneration;
  actor.send({ type: "SET_TO_ID", toId: friendA.sub });
  actor.send({ type: "SET_OFFER_MEME", memeId: memeA.id });
  actor.send({ type: "SET_OFFER_SHARES", shares: 4 });
  actor.send({ type: "SET_OFFER_COINS", coins: 12 });
  actor.send({ type: "SET_ASK_MEME", memeId: memeB.id });
  actor.send({ type: "SET_ASK_SHARES", shares: 6 });
  actor.send({ type: "SET_ASK_COINS", coins: 8 });
  expect(tradeProposalPayload(actor.getSnapshot().context)).toEqual({
    toId: friendA.sub,
    offer: { memes: [{ memeId: memeA.id, shares: 4 }], coins: 12 },
    ask: { memes: [{ memeId: memeB.id, shares: 6 }], coins: 8 },
  });
  actor.send({
    type: "SET_FRIENDS",
    friends: [friendA],
    composeGeneration: generation,
  });
  actor.send({
    type: "SET_BINDER",
    binder: [memeA],
    composeGeneration: generation,
  });
  actor.send({
    type: "SET_ALL_MEMES",
    memes: [memeA],
    composeGeneration: generation,
  });
  actor.send({ type: "CLOSE_COMPOSE" });
  actor.send({ type: "OPEN_COMPOSE" });

  expect(actor.getSnapshot().context).toMatchObject({
    showNew: true,
    friends: [],
    binder: [],
    allMemes: [],
  });

  const currentGeneration = actor.getSnapshot().context.composeGeneration;
  actor.send({ type: "CLOSE_COMPOSE", composeGeneration: currentGeneration });
  expect(actor.getSnapshot().context.showNew).toBe(false);
  actor.stop();
});

test("a stale proposal completion cannot close or report an error in a newer composer", () => {
  const actor = createActor(tradesMachine).start();

  actor.send({ type: "OPEN_COMPOSE" });
  const generationA = actor.getSnapshot().context.composeGeneration;
  actor.send({ type: "CLOSE_COMPOSE" });
  actor.send({ type: "OPEN_COMPOSE" });
  const generationB = actor.getSnapshot().context.composeGeneration;
  actor.send({
    type: "SET_FRIENDS",
    friends: [friendB],
    composeGeneration: generationB,
  });
  actor.send({ type: "SET_BUSY", busy: true, composeGeneration: generationB });
  actor.send({ type: "CLOSE_COMPOSE", composeGeneration: generationA });
  actor.send({
    type: "SET_COMPOSE_ERR",
    err: "proposal failed",
    composeGeneration: generationA,
  });
  actor.send({ type: "SET_BUSY", busy: false, composeGeneration: generationA });

  expect(actor.getSnapshot().context).toMatchObject({
    showNew: true,
    busy: true,
    composeErr: null,
    friends: [friendB],
  });
  actor.stop();
});
