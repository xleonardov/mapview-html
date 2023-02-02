import { Event } from "nostr-tools";

export type MaybeLocalStorage = Partial<WindowLocalStorage>;

export type NostrEvent = Required<Event>;

export type UnsignedEvent = Omit<Event, "created_at" | "pubkey">;

export type Note = {
  plusCode: string;
  content: string;
  authorName: string;
  authorPublicKey: string;
};

export type Profile = {
  publicKey: string;
  name: string;
  about: string;
  picture: string;
};
