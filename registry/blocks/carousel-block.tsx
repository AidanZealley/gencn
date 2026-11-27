'use client'

import { Carousel } from 'gencn'
import { defineBlock } from 'gencn/react'
import {
  Carousel as ImageCarousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

export const carouselBlock = defineBlock(Carousel, ({ props }) => (
  <ImageCarousel aria-label={props.label} className="min-w-0">
    <CarouselContent>
      {props.images.map(({ src, alt, caption }, index) => (
        <CarouselItem
          key={index}
          aria-label={`${index + 1} of ${props.images.length}`}
        >
          <figure>
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="aspect-video w-full rounded-lg bg-muted object-contain"
            />
            {caption && (
              <figcaption className="mt-2 text-sm text-muted-foreground">
                {caption}
              </figcaption>
            )}
          </figure>
        </CarouselItem>
      ))}
    </CarouselContent>
    {props.images.length > 1 && (
      <div className="mt-2 flex justify-end gap-2">
        <CarouselPrevious className="static translate-x-0 translate-y-0" />
        <CarouselNext className="static translate-x-0 translate-y-0" />
      </div>
    )}
  </ImageCarousel>
))
