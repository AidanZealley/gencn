import { defineRegistry } from '@json-render/react'
import { BadgeBlock } from '@/components/generative/badge-block'
import { ButtonBlock } from '@/components/generative/button-block'
import { CardBlock } from '@/components/generative/card-block'
import { GridBlock } from '@/components/generative/grid-block'
import { HeadingBlock } from '@/components/generative/heading-block'
import { ImageBlock } from '@/components/generative/image-block'
import { SelectBlock } from '@/components/generative/select-block'
import { SeparatorBlock } from '@/components/generative/separator-block'
import { SliderBlock } from '@/components/generative/slider-block'
import { StackBlock } from '@/components/generative/stack-block'
import { StatBlock } from '@/components/generative/stat-block'
import { SwitchBlock } from '@/components/generative/switch-block'
import { TextBlock } from '@/components/generative/text-block'
import { catalog } from './catalog'

/** Block name → installed component. A catalog block missing here fails tsc. */
export const { registry } = defineRegistry(catalog, {
  components: {
    Card: CardBlock,
    Stack: StackBlock,
    Grid: GridBlock,
    Separator: SeparatorBlock,
    Heading: HeadingBlock,
    Text: TextBlock,
    Image: ImageBlock,
    Stat: StatBlock,
    Badge: BadgeBlock,
    Switch: SwitchBlock,
    Slider: SliderBlock,
    Select: SelectBlock,
    Button: ButtonBlock,
  },
})
