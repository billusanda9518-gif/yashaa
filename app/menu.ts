export type Dish = {
  slug: string;
  name: string;
  price: string;
  image: string;
  model: string;
  description: string;
};

export const dishes: Dish[] = [
  {
    slug: "pizza",
    name: "Pizza",
    price: "$18",
    image: "/menu/pizza.png",
    model: "/models/pizza.glb",
    description: "Wood-fired crust, basil, tomato, and hand-torn mozzarella.",
  },
  {
    slug: "burger",
    name: "Burger",
    price: "$16",
    image: "/menu/burger.png",
    model: "/models/burger.glb",
    description: "Brioche bun, cheddar, crisp greens, and house sauce.",
  },
  {
    slug: "pasta",
    name: "Pasta",
    price: "$17",
    image: "/menu/pasta.png",
    model: "/models/pasta.glb",
    description: "Silky tomato cream, parmesan, and fresh basil.",
  },
  {
    slug: "coffee",
    name: "Coffee",
    price: "$7",
    image: "/menu/coffee.png",
    model: "/models/coffee.glb",
    description: "Velvety espresso, steamed milk, and cafe latte art.",
  },
];

export function getDish(slug: string) {
  return dishes.find((dish) => dish.slug === slug);
}
