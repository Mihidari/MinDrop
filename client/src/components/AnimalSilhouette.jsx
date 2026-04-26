import React from 'react';
import {
    GiAnglerFish,
    GiBat,
    GiBee,
    GiBoar,
    GiButterfly,
    GiCat,
    GiChicken,
    GiCobra,
    GiCow,
    GiCrab,
    GiDeerHead,
    GiDolphin,
    GiDuck,
    GiEagleHead,
    GiElephantHead,
    GiFoxHead,
    GiFrog,
    GiGoat,
    GiHorseHead,
    GiHummingbird,
    GiLion,
    GiMonkey,
    GiOctopus,
    GiOwl,
    GiPawPrint,
    GiPigFace,
    GiRabbitHead,
    GiRat,
    GiScorpion,
    GiSeahorse,
    GiSharkFin,
    GiSheep,
    GiSittingDog,
    GiSnake,
    GiSnail,
    GiSpiderAlt,
    GiSquirrel,
    GiTigerHead,
    GiTurtle,
    GiWhaleTail,
    GiWolfHead,
} from 'react-icons/gi';

const specialIconRules = [
    { icon: GiCat, pattern: /cat/ },
    { icon: GiFoxHead, pattern: /fox/ },
    { icon: GiWolfHead, pattern: /wolf/ },
    { icon: GiLion, pattern: /lion|leopon/ },
    { icon: GiTigerHead, pattern: /tiger|tiglon/ },
    { icon: GiBat, pattern: /bat/ },
    { icon: GiBee, pattern: /bee|hornet|wasp/ },
    { icon: GiButterfly, pattern: /butterfly|moth/ },
    { icon: GiScorpion, pattern: /scorpion/ },
    { icon: GiCrab, pattern: /crab|crawdad|crayfish|lobster/ },
    { icon: GiSharkFin, pattern: /shark/ },
    { icon: GiAnglerFish, pattern: /angelfish|anglerfish|bass|carp|catfish|clownfish|cod|fish|goldfish|guppy|herring|koi|minnow|perch|pike|piranha|salmon|trout|tuna|whitefish/ },
    { icon: GiSeahorse, pattern: /seahorse/ },
    { icon: GiTurtle, pattern: /tortoise|turtle/ },
    { icon: GiOctopus, pattern: /octopus|squid/ },
    { icon: GiWhaleTail, pattern: /narwhal|orca|whale/ },
    { icon: GiOwl, pattern: /owl/ },
    { icon: GiEagleHead, pattern: /buzzard|condor|eagle|falcon|harrier|hawk|kite|vulture/ },
    { icon: GiDuck, pattern: /duck|goose|swan/ },
    { icon: GiChicken, pattern: /chicken|fowl|gamefowl|junglefowl|rooster/ },
    { icon: GiSquirrel, pattern: /chipmunk|squirrel|xerinae/ },
    { icon: GiRat, pattern: /dormouse|mouse|rat|rodent|vole/ },
    { icon: GiBoar, pattern: /boar/ },
    { icon: GiPigFace, pattern: /boar|pig/ },
    { icon: GiGoat, pattern: /goat/ },
    { icon: GiSheep, pattern: /sheep/ },
    { icon: GiCow, pattern: /bison|bovid|buffalo|cattle|cow|muskox|ox|yak/ },
    { icon: GiDeerHead, pattern: /antelope|caribou|deer|elk|gazelle|impala|moose|reindeer/ },
    { icon: GiCobra, pattern: /cobra/ },
    { icon: GiSnail, pattern: /limpet|slug|snail/ },
];

const categoryRules = [
    {
        icon: GiHummingbird,
        pattern:
            /albatross|bat|bird|blackbird|bobolink|booby|buzzard|cardinal|chickadee|chicken|condor|crane|crow|cuckoo|dove|duck|eagle|egret|emu|falcon|finch|flamingo|fowl|galliform|gamefowl|goose|grouse|guan|guineafowl|gull|harrier|hawk|heron|hummingbird|jay|junglefowl|kingfisher|kite|kiwi|landfowl|lark|loon|macaw|magpie|meadowlark|mockingbird|nightingale|ostrich|owl|parakeet|parrot|partridge|peacock|peafowl|pelican|penguin|pheasant|pigeon|ptarmigan|puffin|quail|quelea|raven|roadrunner|rook|rooster|snipe|sparrow|spoonbill|stork|swallow|swan|swift|tern|thrush|toucan|turkey|vulture|warbler|wildfowl|woodpecker|wren/,
    },
    {
        icon: GiSpiderAlt,
        pattern:
            /ant|antlion|aphid|bedbug|bee|beetle|bug|butterfly|caterpillar|centipede|cicada|cockroach|cricket|damselfly|dragonfly|earwig|firefly|flea|fly|grasshopper|hookworm|hornet|hoverfly|ladybug|leech|locust|louse|mite|mosquito|moth|roundworm|scorpion|silkworm|silverfish|spider|tarantula|termite|tick|wasp|worm/,
    },
    {
        icon: GiTigerHead,
        pattern: /bobcat|cat|catshark|cheetah|cougar|felidae|jaguar|leopard|leopon|lion|lynx|ocelot|panther|puma|tiger|tiglon|wildcat/,
    },
    {
        icon: GiSittingDog,
        pattern: /canid|canidae|coyote|dingo|dog|fox|hyena|jackal|whippet|wolf/,
    },
    {
        icon: GiElephantHead,
        pattern: /elephant|hippopotamus|mammal|manatee|marsupial|mastodon|pinniped|rhinoceros|tapir|walrus/,
    },
    {
        icon: GiDolphin,
        pattern:
            /angelfish|anglerfish|barnacle|barracuda|bass|carp|catfish|cephalopod|clam|clownfish|cod|coral|crab|crawdad|crayfish|dolphin|eel|fish|flyingfish|goldfish|guppy|haddock|halibut|herring|jellyfish|koi|krill|lamprey|limpet|lobster|lungfish|mackerel|marlin|minnow|mollusk|narwhal|octopus|orca|parrotfish|perch|pike|piranha|planarian|porpoise|prawn|sailfish|salmon|sawfish|scallop|seahorse|shark|shrimp|slug|smelt|snail|sole|squid|starfish|stingray|sturgeon|swordfish|swordtail|trout|tuna|whale|whitefish/,
    },
    {
        icon: GiHorseHead,
        pattern:
            /alpaca|antelope|bison|boar|bovid|buffalo|camel|caribou|cattle|cow|deer|donkey|elk|gayal|gazelle|giraffe|goat|guanaco|horse|impala|kangaroo|koala|llama|moose|mule|muskox|ox|pig|pony|reindeer|sheep|tahr|takin|unicorn|urial|vicuna|wallaby|wildebeest|yak|zebra/,
    },
    {
        icon: GiMonkey,
        pattern: /ape|baboon|bonobo|chimpanzee|gibbon|gorilla|lemur|mandrill|marmoset|monkey|orangutan|primate|tarsier/,
    },
    {
        icon: GiRabbitHead,
        pattern: /chinchilla|chipmunk|dormouse|gerbil|gopher|hamster|hare|lemming|marmot|mouse|rabbit|rat|rodent|squirrel|vole|xerinae/,
    },
    {
        icon: GiSnake,
        pattern:
            /alligator|amphibian|anaconda|asp|basilisk|boa|chameleon|cobra|constrictor|crocodile|dinosaur|dragon|gecko|iguana|lizard|newt|python|rattlesnake|reptile|salamander|skink|snake|tortoise|turtle|tyrannosaurus|viper/,
    },
];

const getAnimalName = (name) => {
    const parts = name.trim().toLowerCase().split(/\s+/);
    return parts[parts.length - 1] || '';
};

const getIcon = (animal) => {
    if (animal === 'frog' || animal === 'toad') return GiFrog;
    const specialIcon = specialIconRules.find(({ pattern }) => pattern.test(animal))?.icon;
    if (specialIcon) return specialIcon;

    return categoryRules.find(({ pattern }) => pattern.test(animal))?.icon || GiPawPrint;
};

const AnimalSilhouette = ({ name }) => {
    const animal = getAnimalName(name);
    const Icon = getIcon(animal);
    const isShiny = animal === 'wolf';

    return (
        <span className={`animal-silhouette${isShiny ? ' shiny' : ''}`} role="img" aria-label={`${isShiny ? 'shiny ' : ''}${animal || 'animal'} icon`}>
            <Icon aria-hidden="true" focusable="false" />
        </span>
    );
};

export default AnimalSilhouette;
