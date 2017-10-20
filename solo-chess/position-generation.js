const JCE = require('../jsChessEngine/bin/JCE.js');

const { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } = {
  PAWN: 'P',
  KNIGHT: 'N',
  BISHOP: 'B',
  ROOK: 'R',
  QUEEN: 'Q',
  KING: 'K'
};

const shuffleArr = (arr) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const arrToFen = (arr) => {
  const pieces = arr.map((row) => {
    let strRow = '';
    let counter = 0;
    row.forEach((square) => {
      //- means empty square, * means "empty but unavailable square"
      if (square === '-' || square === '*') {
        counter += 1;
      } else {
        if (counter !== 0) {
          strRow += counter;
          counter = 0;
        }
        strRow += square;
      }
    });
    strRow += (counter !== 0) ? counter : '';
    return strRow;
  }).join('/');

  return `${pieces}`;
};

function generatePosition(numOfPieces) {
  const game = new SoloChessGame(numOfPieces);
  const solution = game.generateSolution();
  return solution;
}

class SoloChessGame {
  constructor(numOfPieces) {
    this.numOfPieces = numOfPieces;
    //cache to store the reachable squares for each piece and square combo
    this.reachableSquaresCache = {};
    //cache to store solutions
    this.solutionCache = {};
    this.maxNumOfpiecesOnBoard = 0;
  }

  getEmptyBoard() {
    return [
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 0
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 1
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 2
      ['-', '-', '-', '-', '-', '-', '-', '-'], //...
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-']
    ];
  }

  /**
   * clear up the board
   */
  clear() {
    this.board = this.getEmptyBoard();
    this.numOfPiecesOnBoard = 0;
  }

  addSolutionToCache(solution) {
    const numOfPieces = solution.numOfPieces;
    if (this.solutionCache[numOfPieces] === undefined) {
      this.solutionCache[numOfPieces] = [];
    }
    //we just need to store the encoded catpure string here
    this.solutionCache[numOfPieces].push({
      encodedCaptures: solution.encodedCaptures
    });
  }

  getEncodedCaptures(captures) {
    return captures.map((capture) => {
      const fromRowCol = `${capture.from.row}${capture.from.col}`;
      const toRowCol = `${capture.to.row}${capture.to.col}`;
      return `${capture.piece}:${fromRowCol}:${toRowCol}`;
    }).join(',');
  }

  /**
   * check if the board is in pawn promotion state
   * make it more strict so that pawn only be at rank 4 or further down
   */
  isPawnPromotion() {
    return this.board[0].includes(PAWN) ||
      this.board[1].includes(PAWN) ||
      this.board[2].includes(PAWN);
  }

  getReachableSquaresOfPiece(piece, square) {
    const key = `${piece}${square.row}${square.col}`;
    if (this.reachableSquaresCache[key] === undefined) {
      const onePieceBoard = this.getEmptyBoard();
      onePieceBoard[square.row][square.col] = piece;
      const reachableSquares = JCE.getLegalMoves(arrToFen(onePieceBoard))
        .map(move => move.to)
        .map(coordinate => ({
          row: 8 - coordinate[1],
          col: coordinate.charCodeAt(0) - 97
        }));

      this.reachableSquaresCache[key] = reachableSquares;
    }
    return this.reachableSquaresCache[key];
  }

  /**
   * get the affected squares on piece move
   */
  getAffectedSquaresOnPieceMove(piece, fromSquare, toSquare) {
    const affectedSquares = [];
    //scan all the squares along the lines between fromSquare and toSquare
    //only perform the scan when the piece is queen, bishop or rook
    if ([QUEEN, BISHOP, ROOK].includes(piece)) {
      const amplifier = Math.max(
        Math.abs(toSquare.row - fromSquare.row),
        Math.abs(toSquare.col - fromSquare.col)
      );
      const delta = [
        Math.floor((fromSquare.row - toSquare.row) / amplifier),
        Math.floor((fromSquare.col - toSquare.col) / amplifier)
      ];
      let row = fromSquare.row;
      let col = fromSquare.col;
      for (;;) {
        row -= delta[0];
        col -= delta[1];
        if (Math.abs(row - toSquare.row) === 0 && Math.abs(col - toSquare.col) === 0) {
          //we have reached the toSquare, stop
          break;
        } else {
          affectedSquares.push({ row, col });
        }
      }
    }
    return affectedSquares;
  }

  /**
   * mark the affected squares
   */
  markAffectedSquares(affectedSquares) {
    affectedSquares.forEach((affectedSquare) => {
      //only mark the empty squares
      if (this.board[affectedSquare.row][affectedSquare.col] === '-') {
        this.board[affectedSquare.row][affectedSquare.col] = '*';
      }
    });
  }

  /**
   * get available source squares when placing a piece to a specific square
   */
  getAvailableSourceSquaresForPlacement(piece, square) {
    //special treatment for pawn, we just place pawn below the square
    let squares = [];
    //we should make sure the square is an empty square
    squares = this.getReachableSquaresOfPiece(piece, square)
      .filter(reachableSquare => this.board[reachableSquare.row][reachableSquare.col] === '-');
    return squares;
  }

  /**
   * play a piece around a targetSquare
   */
  placePieceAroundSquare(piece, toSquare, distance = 1) {
    let sourceSquares = this.getAvailableSourceSquaresForPlacement(piece, toSquare);
    if (sourceSquares.length >= distance) {
      sourceSquares = shuffleArr(sourceSquares);
      for (let i = 0; i < sourceSquares.length; i += 1) {
        const s2 = sourceSquares[i];
        if (distance === 1) {
          this.addPieceToSquare(piece, s2);
          const affectedSquares = this.getAffectedSquaresOnPieceMove(piece, s2, toSquare);
          this.markAffectedSquares(affectedSquares);
          //add capture information
          const from = s2;
          const to = toSquare;
          this.solution.captures.push({
            piece,
            from,
            to
          });
          return;
        } else if (distance === 2) {
          for (let j = 0; j < sourceSquares.length; j += 1) {
            if (i !== j) {
              const s1 = sourceSquares[j];
              const possibleFromSquares = this.getAvailableSourceSquaresForPlacement(piece, s1);

              if (possibleFromSquares.some(possibleFromSquare =>
                possibleFromSquare.row === s2.row &&
                possibleFromSquare.col === s2.col)) {
                //special case:
                //make sure the toSquare does not sit in between s1 and s2
                let affectedSquares = this.getAffectedSquaresOnPieceMove(piece, s2, s1);
                if (!affectedSquares.some(affectedSquare =>
                  affectedSquare.row === toSquare.row &&
                  affectedSquare.col === toSquare.col)) {
                  this.addPieceToSquare(piece, s2);
                  this.markAffectedSquares(affectedSquares);
                  const s1Piece = this.getRandomPiece();
                  this.addPieceToSquare(s1Piece, s1);
                  affectedSquares = this.getAffectedSquaresOnPieceMove(piece, s1, toSquare);
                  this.markAffectedSquares(affectedSquares);
                  //add capture information
                  this.solution.captures.push({
                    piece,
                    from: s2,
                    to: s1
                  });
                  this.solution.captures.push({
                    piece,
                    from: s1,
                    to: toSquare
                  });
                  return;
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * get a random piece
   * we optionally pass in piece power
   */
  getRandomPiece(piecePower = 1) {
    let availablePcs = [KNIGHT, QUEEN, PAWN, ROOK, BISHOP];
    if (piecePower > 10) {
      availablePcs = [QUEEN, ROOK, BISHOP, KNIGHT];
    } else if (piecePower > 20) {
      availablePcs = [QUEEN, BISHOP, KNIGHT];
    }
    return availablePcs[Math.floor(Math.random() * availablePcs.length)];
  }

  /**
   * get a random square
   * with higher piece power, we generate close-to-center squares
   */
  getRandomSquare(piecePower) {
    let square;
    if (piecePower > 10) {
      square = {
        row: 2 + Math.floor(Math.random() * 4),
        col: 2 + Math.floor(Math.random() * 4)
      };
    } else {
      square = {
        row: Math.floor(Math.random() * 8),
        col: Math.floor(Math.random() * 8)
      };
    }
    return square;
  }

  addPieceToSquare(piece, square) {
    this.board[square.row][square.col] = piece;
    this.numOfPiecesOnBoard += 1;
  }

  generateSolution() {
    for (let round = 1; round <= 100; round += 1) {
      this.solution = {};
      this.solution.captures = [];
      this.clear();
      const rootPiece = this.getRandomPiece(); //we simply exclude pawn here!
      const piecePower = round;
      const rootSquare = this.getRandomSquare(piecePower);
      this.addPieceToSquare(rootPiece, rootSquare); //root

      for (let t = 1; t <= 500; t += 1) {
        const piece = this.getRandomPiece(piecePower + t);
        const numOfMovements = 1 + Math.floor(Math.random() * 2);
        this.placePieceAroundSquare(piece, rootSquare, numOfMovements);
        if (this.numOfPiecesOnBoard === this.numOfPieces && !this.isPawnPromotion()) {
          this.solution.fen = arrToFen(this.board);
          this.addSolutionToCache({
            numOfPieces: this.numOfPieces,
            fen: this.solution.fen,
            encodedCaptures: this.getEncodedCaptures(this.solution.captures)
          });
          return this.solution;
        }
      }
    }
  }
}

/////////////////////// Main ///////////////////////////
generatePosition(20);
