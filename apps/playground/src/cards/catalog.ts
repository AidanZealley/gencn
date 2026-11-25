import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import {
  Badge,
  Button,
  Card,
  Grid,
  Heading,
  Image,
  Select,
  Separator,
  Slider,
  Stack,
  Stat,
  Switch,
  Text,
} from '@gencn/core'

/**
 * The blocks this app has installed, listed one by one: never spread
 * `@gencn/core`, or an update would offer blocks the app doesn't have.
 * No actions of its own yet: specs use built-ins such as `setState`.
 */
export const catalog = defineCatalog(schema, {
  components: {
    Card,
    Stack,
    Grid,
    Separator,
    Heading,
    Text,
    Image,
    Stat,
    Badge,
    Switch,
    Slider,
    Select,
    Button,
  },
  // Required by json-render's types, even when empty.
  actions: {},
})
