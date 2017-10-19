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
  return game.generateSolution();
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
    this.pieceInfoMap = [];
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
   * check if a piece is in pawn promotion state
   */
  isPawnPromotion(piece, square) {
    return piece === PAWN && square.row < 2;
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

  getAffectedSquaresOnPieceMove(piece, fromSquare, toSquare) {
    const squares = [];
    //only queen, bishop, rook should have affected squares
    if ([QUEEN, BISHOP, ROOK].includes(piece)) {
      const amplifier = Math.max(
        Math.abs(toSquare.row - fromSquare.row),
        Math.abs(toSquare.col - fromSquare.col)
      );
      const delta = [
        (fromSquare.row - toSquare.row) / amplifier,
        (fromSquare.col - toSquare.col) / amplifier
      ];
      let row = fromSquare.row;
      let col = fromSquare.col;
      for (;;) {
        row -= delta[0];
        col -= delta[1];
        if (Math.abs(row - toSquare.row) === 0 && Math.abs(col - toSquare.col) === 0) {
          break;
        } else if (this.board[row][col] === '-') { //this is really an empty square, add it
          squares.push({ row, col });
        }
      }
    }
    return squares;
  }

  /**
   * get available source squares when placing a piece to a specific square
   */
  getAvailableSourceSquaresForPlacement(piece, square) {
    //special treatment for pawn, we just place pawn below the square
    let squares = [];
    if (piece === PAWN) {
      const sourceSquare = [{
        row: square.row + 1,
        col: square.col
      }];
      //make sure the source square is still inside board
      //also not in pawn promotion
      //and this square is an empty square
      if (sourceSquare.row > 1 && sourceSquare.row <= 7 &&
        !this.isPawnPromotion(piece, sourceSquare) &&
        this.board[sourceSquare.row][sourceSquare.col] === '-') {
        squares.push(sourceSquare);
      }
    } else {
      //we should make sure the square is an empty square
      squares = this.getReachableSquaresOfPiece(piece, square)
        .filter(reachableSquare => this.board[reachableSquare.row][reachableSquare.col] === '-');
    }

    return squares;
  }

  /**
   * place a piece around a specific square
   */
  placePieceAroundSquare(piece, square) {
    const result = {};
    const sourceSquares = this.getAvailableSourceSquaresForPlacement(piece, square);
    if (sourceSquares.length === 0) {
      result.success = false;
      return result;
    }
    const sourceSquare = sourceSquares[Math.floor(Math.random() * sourceSquares.length)];
    this.addPieceToSquare(piece, sourceSquare);
    const affectedSquares = this.getAffectedSquaresOnPieceMove(piece, sourceSquare, square);

    affectedSquares.forEach((affectedSquare) => {
      this.board[affectedSquare.row][affectedSquare.col] = '*';
    });

    result.success = true;
    result.square = sourceSquare;
    return result;
  }

  /**
   * make a sudo move and mark affected squares on the board
   */
  makeSudoMove(piece, fromSquare, toSquare) {
    let result = true;

    //first of all, make sure the fromSquare is an empty square
    if (this.board[fromSquare.row][fromSquare.col] !== '-') {
      result = false;
      return result;
    }

    //for all non-pawn pieces, see if the piece can move from the toSquare to fromSquare
    //place the piece on toSquare
    if (!this.getAvailableSourceSquaresForPlacement(piece, toSquare)
      .some(square => square.row === fromSquare.row && square.col === fromSquare.col)) {
      result = false;
      return result;
    }

    let possibleAffectedSquares = [];
    //only queen, bishop, rook needs to check if in-between there are:
    //1. blocking pieces
    //2. affected squares from previous added pieces
    if ([QUEEN, BISHOP, ROOK].includes(piece)) {
      const amplifier = Math.max(
        Math.abs(toSquare.row - fromSquare.row),
        Math.abs(toSquare.col - fromSquare.col)
      );
      const delta = [
        (fromSquare.row - toSquare.row) / amplifier,
        (fromSquare.col - toSquare.col) / amplifier
      ];
      let row = fromSquare.row;
      let col = fromSquare.col;
      for (;;) {
        row -= delta[0];
        col -= delta[1];

        //there is a blocking pieces or a square affected by other pieces
        if (Math.abs(row - toSquare.row) === 0 &&
          Math.abs(col - toSquare.col) === 0) {
          break;
        } else if (this.board[row][col] !== '-') {
          //there is a blocking pieces or a square affected by other pieces
          break;
        }
        //now this is an empty square
        //add this empty square to the possible affected squares
        possibleAffectedSquares.push({ row, col });
      }
    }

    if (result) {
      //now we can really make a move
      //add the piece if the square is empty
      this.addPieceToSquare(piece, fromSquare);
      //mark the affected squares
      //we can really add
      possibleAffectedSquares.forEach((square) => {
        this.board[square.row][square.col] = '*';
      });
    }

    return result;
  }

  /**
   * get a random piece
   * note: we exclude kings here
   */
  getRandomPiece() {
    const availablePcs = [KNIGHT, QUEEN, PAWN, ROOK, BISHOP];
    return availablePcs[Math.floor(Math.random() * availablePcs.length)];
  }

  /**
   * get a random square
   */
  getRandomSquare() {
    return {
      row: Math.floor(Math.random() * 8),
      col: Math.floor(Math.random() * 8)
    };
  }

  addPieceToSquare(piece, square) {
    this.board[square.row][square.col] = piece;
    this.numOfPiecesOnBoard += 1;
  }

  generateSolutionWithRootPiece(rootPiece, rootSquare, numOfPieces, hasKing) {
    const solution = {};
    solution.lastPiece = rootPiece;
    solution.valid = true;

    let piece;

    //first, add all child pieces
    for (let i = 0; i < numOfPieces - 1; i += 1) {
      let placementSuccess = false;
      for (let it = 1; it <= 200; it += 1) { //it means inner trys
        //when this tree has king and this node is the last node in the tree
        //this node is the very last piece
        if (i === numOfPieces - 2 && hasKing) {
          piece = this.lastPiece;
        } else {
          piece = this.getRandomPiece();
        }
        const result = this.placePieceAroundSquare(piece, rootSquare);
        if (result.success) {
          const from = result.square;
          const to = rootSquare;
          placementSuccess = true;
          solution.lastPiece = piece;
          //now generate the capture
          this.solution.captures.push({
            piece,
            from,
            to
          });
          break;
        }
      }
      if (!placementSuccess) {
        solution.valid = false;
        break;
      }
    }

    return solution;
  }

  generateSolution() {
    this.board = this.getEmptyBoard();
    this.numOfPieces = 0;
    this.numOfPiecesOnBoard = 0;
    //just do some random fun stuffs here
    this.addPieceToSquare('N*', { row: 2, col: 2 }); //root
    for (;;) {
      let fromSquare = this.getRandomSquare();
      let piece;
      if (this.numOfPiecesOnBoard < 12) {
        piece = this.getRandomPiece();
      } else {
        piece = KING;
      }
      this.makeSudoMove(piece, fromSquare, { row: 2, col: 2 });
      if (this.numOfPiecesOnBoard === 13) {
        break;
      }
    }
    console.log(this.board);
    return;

    this.solution = {};
    for (let t = 1; t <= 1000; t += 1) { //t means outer trys
      this.solution.captures = [];
      this.clear();

      this.hasKing = Math.round(Math.random()); //will this solution contains king?

      //divide all pieces among 2 trees
      const numOfPieces1 = 1 + Math.floor(Math.random() * (this.numOfPieces - 1));
      const numOfPieces2 = this.numOfPieces - numOfPieces1;

      let rootSquare;
      let rootPiece;
      let nextRootPiece;
      let nextRootSquare;
      let reachableSquares;

      for (;;) {
        //generate the root piece and square
        //the first tree does not have king
        rootPiece = this.getRandomPiece();
        rootSquare = this.getRandomSquare();

        //now pre-determine the last piece
        if (this.hasKing) { //if we have king, last piece will always be king
          this.lastPiece = KING;
        } else {
          this.lastPiece = this.getRandomPiece();
        }

        //the second tree might have king
        //generate the next root piece, this piece will not move
        //special case, if the tree has just one piece
        //the next root piece will just be the last piece
        if (numOfPieces2 === 1 && this.hasKing) {
          nextRootPiece = this.lastPiece;
        } else { //otherwise, just randomly generate a piece for the next root
          nextRootPiece = this.getRandomPiece();
        }

        //we need to make sure the last piece can reach root square from the next root square
        reachableSquares = this.getReachableSquaresOfPiece(this.lastPiece, rootSquare);

        if (reachableSquares.length > 0 &&
          rootPiece !== PAWN &&
          nextRootPiece !== PAWN) {
          nextRootSquare = reachableSquares[
            Math.floor(Math.random() * reachableSquares.length)
          ];

          break;
        }
      }

      //now we have the root piece, add it first
      this.addPieceToSquare(rootPiece, rootSquare);

      //the first tree will not have king
      const solution1 = this.generateSolutionWithRootPiece(
        rootPiece,
        rootSquare,
        numOfPieces1,
        false);
      //the second tree might have king
      const solution2 = this.generateSolutionWithRootPiece(
        nextRootPiece,
        nextRootSquare,
        numOfPieces2, this.hasKing);

      //make sure both solutions are ok
      //and we can really add next root piece into the board
      if (solution1.valid &&
        solution2.valid &&
        this.board[nextRootSquare.row][nextRootSquare.col] === '-'
      ) {
        //now we can safely add the next root
        this.addPieceToSquare(nextRootPiece, nextRootSquare);

        //now we have both next root piece and the root piece, add the capture information
        //simply record capture from next root node to the first root node
        this.solution.captures.push({
          piece: solution2.lastPiece,
          from: nextRootSquare,
          to: rootSquare
        });

        this.solution.fen = arrToFen(this.board);

        if (this.numOfPiecesOnBoard === this.numOfPieces) {
          this.maxNumOfpiecesOnBoard = this.numOfPiecesOnBoard;
          //now this solution is good, add it to the solution cache
          this.addSolutionToCache({
            numOfPieces: this.numOfPieces,
            fen: this.solution.fen,
            encodedCaptures: this.getEncodedCaptures(this.solution.captures)
          });
          break;
        } else if (this.numOfPiecesOnBoard > this.maxNumOfpiecesOnBoard) {
          this.maxNumOfpiecesOnBoard = this.numOfPiecesOnBoard;
        }
      }
    }

    console.log(this.board);
    console.log(this.numOfPiecesOnBoard);
    console.log(this.getEncodedCaptures(this.solution.captures));
    return this.solution;
  }
}

/////////////////////// Main ///////////////////////////
generatePosition(7);
