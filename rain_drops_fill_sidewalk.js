/**
 * The sidewalk is 1m long, rain drop is 1cm each
 * find out how many rain drops will fill the sidewalk
 * Time Complexity: O(N) --- N is the number of raindrops
 */

class RainDrop {
  constructor(startPos) {
    this.startPos = startPos;
  }

  getStartPos() {
    return this.startPos;
  }

  getEndPos() {
    return this.startPos + 1;
  }
}

class SideWalk {
  constructor() {
    //we just want the difference of the delta is small enough to consider "filled"
    this.delta = 0.05;
    this.numOfRainDrops = 0;
    this.numOfFilledSlots = 0;
    this.slots = [];
    for (let i = 0; i < 100; i = i + 1) {
      this.slots[i] = {};
      this.slots[i].dryStartPos = i;
      this.slots[i].dryEndPos = i + 1;
      this.slots[i].isFilled = false;
    }
  }

  addRainDrop(rainDrop) {
    const startPos = rainDrop.getStartPos();
    const endPos = rainDrop.getEndPos();
    const slotIndex = Math.floor(startPos);

    const curSlot = this.slots[slotIndex];

    this.numOfRainDrops = this.numOfRainDrops + 1;

    if (!curSlot.isFilled) {

      //examine the current slot, update the dryEndPos
      if (startPos < curSlot.dryEndPos) {
        curSlot.dryEndPos = startPos;
      }

      curSlot.dryLength = curSlot.dryEndPos - curSlot.dryStartPos;

      if ( curSlot.dryLength <= this.delta) {
        //this means the current slot is filled already
        curSlot.isFilled = true;
        this.numOfFilledSlots = this.numOfFilledSlots + 1;
      }
    }

    //examine the next slot, update the dryStartPos
    const nextSlotIndex = slotIndex + 1;
    if (nextSlotIndex < 100) {
      const nextSlot = this.slots[slotIndex];
      if (!nextSlot.isFilled) {
        if (endPos > nextSlot.dryStartPos) {
          nextSlot.dryStartPos = endPos;
          nextSlot.dryLength = nextSlot.dryEndPos - nextSlot.dryStartPos;
          if ( nextSlot.dryLength <= this.delta) {
            //this means the next slot is filled already
            nextSlot.isFilled = true;
            this.numOfFilledSlots = this.numOfFilledSlots + 1;
          }
        }
      }
    }
  }

  getSlots() {
    return this.slots;
  }

  isFilled() {
    return this.numOfFilledSlots == 100;
  }

  getNumOfRainDrops() {
    return this.numOfRainDrops;
  }
}

function getRandomIntegerWithin(min, max) { //min inclusive, max exclusive
  return Math.random() * (max - min) + min;
}

function getTotalNumberOfRainDropsUntilFilled(sidewalk) {
  const rainDrops = [];

  for(;;) {
    const rdStartPos = getRandomIntegerWithin(0,100);
    sidewalk.addRainDrop( new RainDrop(rdStartPos) );
    if (sidewalk.isFilled()) {
      break;
    }
  }

  return sidewalk.getNumOfRainDrops();
}

console.log(getTotalNumberOfRainDropsUntilFilled(new SideWalk()));
