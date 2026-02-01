// Type definitions for next-intl messages
type Messages = typeof import('../messages/en.json');

declare global {
    interface IntlMessages extends Messages { }
}
