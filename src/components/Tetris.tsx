import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

// 方块形状定义
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: 'rgb(59, 130, 246)', // blue
  O: 'rgb(234, 179, 8)', // yellow
  T: 'rgb(168, 85, 247)', // purple
  S: 'rgb(34, 197, 94)', // green
  Z: 'rgb(239, 68, 68)', // red
  J: 'rgb(249, 115, 22)', // orange
  L: 'rgb(236, 72, 153)' // pink
};

type ShapeType = keyof typeof SHAPES;

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  type: ShapeType;
}

const createEmptyBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

const randomShape = (): ShapeType => {
  const shapes = Object.keys(SHAPES) as ShapeType[];
  return shapes[Math.floor(Math.random() * shapes.length)];
};

const createPiece = (): Piece => {
  const type = randomShape();
  return {
    shape: SHAPES[type],
    x: Math.floor(BOARD_WIDTH / 2) - 1,
    y: 0,
    type
  };
};

export function Tetris() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece>(createPiece());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const checkCollision = useCallback((piece: Piece, offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          
          if (
            newX < 0 ||
            newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const mergePiece = useCallback(() => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.type;
          }
        }
      }
    }
    
    setBoard(newBoard);
    return newBoard;
  }, [board, currentPiece]);

  const clearLines = useCallback((currentBoard: (ShapeType | null)[][]) => {
    let linesCleared = 0;
    const newBoard = currentBoard.filter(row => {
      if (row.every(cell => cell !== null)) {
        linesCleared++;
        return false;
      }
      return true;
    });
    
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    
    if (linesCleared > 0) {
      setScore(prev => prev + linesCleared * 100);
      setBoard(newBoard);
    }
  }, []);

  const rotatePiece = useCallback(() => {
    if (gameOver || isPaused) return;
    
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const rotatedPiece = { ...currentPiece, shape: rotated };
    if (!checkCollision(rotatedPiece)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, checkCollision, gameOver, isPaused]);

  const moveDown = useCallback(() => {
    if (gameOver || isPaused) return;
    
    if (!checkCollision(currentPiece, 0, 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      const newBoard = mergePiece();
      clearLines(newBoard);
      
      const newPiece = createPiece();
      if (checkCollision(newPiece)) {
        setGameOver(true);
      } else {
        setCurrentPiece(newPiece);
      }
    }
  }, [currentPiece, checkCollision, mergePiece, clearLines, gameOver, isPaused]);

  const moveHorizontal = useCallback((direction: number) => {
    if (gameOver || isPaused) return;
    
    if (!checkCollision(currentPiece, direction, 0)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + direction }));
    }
  }, [currentPiece, checkCollision, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
          moveHorizontal(1);
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
        case ' ':
          rotatePiece();
          break;
        case 'p':
        case 'P':
          setIsPaused(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveHorizontal, moveDown, rotatePiece, gameOver]);

  useEffect(() => {
    if (gameOver || isPaused) return;
    
    const interval = setInterval(moveDown, 1000);
    return () => clearInterval(interval);
  }, [moveDown, gameOver, isPaused]);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(createPiece());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const renderCell = (x: number, y: number) => {
    let cellType: ShapeType | null = board[y][x];
    
    // 检查当前方块
    for (let py = 0; py < currentPiece.shape.length; py++) {
      for (let px = 0; px < currentPiece.shape[py].length; px++) {
        if (
          currentPiece.shape[py][px] &&
          currentPiece.y + py === y &&
          currentPiece.x + px === x
        ) {
          cellType = currentPiece.type;
        }
      }
    }
    
    return (
      <div
        key={`${x}-${y}`}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: cellType ? COLORS[cellType] : 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
          boxSizing: 'border-box'
        }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-teal-600">俄罗斯方块</h1>
      
      <Card className="p-6">
        <div className="flex gap-6">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
              gap: 0,
              border: '2px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))'
            }}
          >
            {board.map((row, y) => row.map((_, x) => renderCell(x, y)))}
          </div>
          
          <div className="flex flex-col gap-4">
            <Card className="p-4 min-w-[150px]">
              <div className="text-sm text-muted-foreground">分数</div>
              <div className="text-2xl font-bold text-foreground">{score}</div>
            </Card>
            
            <div className="flex flex-col gap-2">
              <Button onClick={resetGame} variant="default" className="w-full">
                {gameOver ? '重新开始' : '新游戏'}
              </Button>
              <Button 
                onClick={() => setIsPaused(!isPaused)} 
                variant="outline"
                disabled={gameOver}
                className="w-full"
              >
                {isPaused ? '继续' : '暂停'}
              </Button>
            </div>
            
            <Card className="p-4 text-sm text-muted-foreground">
              <div className="font-semibold mb-2 text-foreground">操作说明</div>
              <div>← → 左右移动</div>
              <div>↓ 快速下落</div>
              <div>↑ / 空格 旋转</div>
              <div>P 暂停</div>
            </Card>
            
            {gameOver && (
              <Card className="p-4 bg-destructive/10 border-destructive">
                <div className="font-bold text-destructive">游戏结束!</div>
              </Card>
            )}
            
            {isPaused && !gameOver && (
              <Card className="p-4 bg-primary/10 border-primary">
                <div className="font-bold text-primary">已暂停</div>
              </Card>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
