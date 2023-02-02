import { Kind, Filter } from "nostr-tools";
import { MAP_NOTE_KIND, PLUS_CODE_TAG_KEY } from "../constants";
import { NostrEvent, Note, Profile } from "../types";
import { _subscribe } from "./relays";
import {
  getProfileFromEvent,
  getPublicKeyFromEvent,
  getTagFirstValueFromEvent,
} from "./utils";

const eventToNoteMinusProfile = ({
  event,
}: {
  event: NostrEvent;
}): Omit<Note, "authorName"> => {
  // NOTE: We need to cast `note.kind` here because the `NostrEvent` type has a
  // enum for Kinds, which doesn't include our custom kind.
  if ((event.kind as number) !== MAP_NOTE_KIND) {
    throw new Error("#w27ijD Cannot convert event of wrong kind to note");
  }

  const plusCode = getTagFirstValueFromEvent({ event, tag: PLUS_CODE_TAG_KEY });
  if (typeof plusCode === "undefined") {
    throw new Error("#C7a4Ck Cannot convert invalid event to note");
  }

  const publicKey = getPublicKeyFromEvent({ event });

  const { content } = event;

  return {
    authorPublicKey: publicKey,
    content,
    plusCode,
  };
};

const eventsToNotes = ({
  noteEvents,
  profileEvents,
}: {
  noteEvents: NostrEvent[];
  profileEvents: NostrEvent[];
}) => {
  const profiles = profileEvents.reduce<{ [publicKey: string]: Profile }>(
    (profiles, event) => {
      const profile = getProfileFromEvent({ event });
      const publicKey = getPublicKeyFromEvent({ event });
      return { ...profiles, [publicKey]: profile };
    },
    {}
  );

  const notes = noteEvents.map((event): Note => {
    const baseNote = eventToNoteMinusProfile({ event });
    const profile = profiles[baseNote.authorPublicKey];
    const authorName = profile?.name || "";
    return { ...baseNote, authorName };
  });

  return notes;
};

type SubscribeParams = {
  /** The public key of the user to fetch events for, or undefined to fetch events from all users */
  publicKey?: string;
  /** The maximum number of notes to fetch
   * @default 200
   */
  limit?: number;
  onNoteReceived: (note: Note) => void;
};
export const subscribe = async ({
  publicKey,
  onNoteReceived,
  limit = 200,
}: SubscribeParams) => {
  // TODO - Start a subscription, unpack events, return on EOSE
  const getEventsForSpecificAuthor = typeof publicKey !== "undefined";

  const eventsFilter: Filter = getEventsForSpecificAuthor
    ? { authors: [publicKey] }
    : { kinds: [MAP_NOTE_KIND] };
  const eventsFilterWithLimit = { ...eventsFilter, limit };

  const noteEvents: NostrEvent[] = [];

  const onNoteEvent = (event: NostrEvent) => {
    noteEvents.push(event);
  };

  const eventSubscriptions = _subscribe({
    filters: [eventsFilterWithLimit],
    onEvent: onNoteEvent,
  });
  await Promise.race(eventSubscriptions);

  const authors = getEventsForSpecificAuthor
    ? [publicKey]
    : noteEvents.map((event) => getPublicKeyFromEvent({ event }));
  const profileFilter: Filter = {
    kinds: [Kind.Metadata],
    authors,
  };

  const profileEvents: NostrEvent[] = [];
  const onProfileEvent = (event: NostrEvent) => {
    profileEvents.push(event);
  };

  const profileSubscriptions = _subscribe({
    filters: [profileFilter],
    onEvent: onProfileEvent,
  });
  await Promise.race(profileSubscriptions);

  // NOTE: At this point we should have fetched all the stored events, and all
  // the profiles of the authors of all of those events
  const notes = eventsToNotes({ noteEvents, profileEvents });

  notes.forEach((note) => onNoteReceived(note));

  // TODO - How can we make this into a subscription instead of a fetch?
  // This will be crucial to ensure that newly posted notes get added to the map
};
