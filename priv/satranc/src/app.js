(function () {
    'use strict';

    const colors = ['white', 'black'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const invRanks = [...ranks].reverse();
    const allKeys = Array.prototype.concat(...files.map(c => ranks.map(r => c + r)));
    const pos2key = (pos) => allKeys[8 * pos[0] + pos[1]];
    const key2pos = (k) => [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];
    const allPos = allKeys.map(key2pos);
    function memo(f) {
        let v;
        const ret = () => {
            if (v === undefined)
                v = f();
            return v;
        };
        ret.clear = () => {
            v = undefined;
        };
        return ret;
    }
    const timer = () => {
        let startAt;
        return {
            start() {
                startAt = performance.now();
            },
            cancel() {
                startAt = undefined;
            },
            stop() {
                if (!startAt)
                    return 0;
                const time = performance.now() - startAt;
                startAt = undefined;
                return time;
            },
        };
    };
    const opposite = (c) => (c === 'white' ? 'black' : 'white');
    const distanceSq = (pos1, pos2) => {
        const dx = pos1[0] - pos2[0], dy = pos1[1] - pos2[1];
        return dx * dx + dy * dy;
    };
    const samePiece = (p1, p2) => p1.role === p2.role && p1.color === p2.color;
    const posToTranslate = (bounds) => (pos, asWhite) => [((asWhite ? pos[0] : 7 - pos[0]) * bounds.width) / 8, ((asWhite ? 7 - pos[1] : pos[1]) * bounds.height) / 8];
    const translate = (el, pos) => {
        el.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
    };
    const translateAndScale = (el, pos, scale = 1) => {
        el.style.transform = `translate(${pos[0]}px,${pos[1]}px) scale(${scale})`;
    };
    const setVisible = (el, v) => {
        el.style.visibility = v ? 'visible' : 'hidden';
    };
    const eventPosition = (e) => {
        var _a;
        if (e.clientX || e.clientX === 0)
            return [e.clientX, e.clientY];
        if ((_a = e.targetTouches) === null || _a === void 0 ? void 0 : _a[0])
            return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
        return; // touchend has no position!
    };
    const isRightButton = (e) => e.buttons === 2 || e.button === 2;
    const createEl = (tagName, className) => {
        const el = document.createElement(tagName);
        if (className)
            el.className = className;
        return el;
    };
    function computeSquareCenter(key, asWhite, bounds) {
        const pos = key2pos(key);
        if (!asWhite) {
            pos[0] = 7 - pos[0];
            pos[1] = 7 - pos[1];
        }
        return [
            bounds.left + (bounds.width * pos[0]) / 8 + bounds.width / 16,
            bounds.top + (bounds.height * (7 - pos[1])) / 8 + bounds.height / 16,
        ];
    }

    const diff = (a, b) => Math.abs(a - b);
    const pawn = (color) => (x1, y1, x2, y2) => diff(x1, x2) < 2 &&
        (color === 'white'
            ? // allow 2 squares from first two ranks, for horde
                y2 === y1 + 1 || (y1 <= 1 && y2 === y1 + 2 && x1 === x2)
            : y2 === y1 - 1 || (y1 >= 6 && y2 === y1 - 2 && x1 === x2));
    const knight = (x1, y1, x2, y2) => {
        const xd = diff(x1, x2);
        const yd = diff(y1, y2);
        return (xd === 1 && yd === 2) || (xd === 2 && yd === 1);
    };
    const bishop = (x1, y1, x2, y2) => {
        return diff(x1, x2) === diff(y1, y2);
    };
    const rook = (x1, y1, x2, y2) => {
        return x1 === x2 || y1 === y2;
    };
    const queen = (x1, y1, x2, y2) => {
        return bishop(x1, y1, x2, y2) || rook(x1, y1, x2, y2);
    };
    const king = (color, rookFiles, canCastle) => (x1, y1, x2, y2) => (diff(x1, x2) < 2 && diff(y1, y2) < 2) ||
        (canCastle &&
            y1 === y2 &&
            y1 === (color === 'white' ? 0 : 7) &&
            ((x1 === 4 && ((x2 === 2 && rookFiles.includes(0)) || (x2 === 6 && rookFiles.includes(7)))) ||
                rookFiles.includes(x2)));
    function rookFilesOf(pieces, color) {
        const backrank = color === 'white' ? '1' : '8';
        const files = [];
        for (const [key, piece] of pieces) {
            if (key[1] === backrank && piece.color === color && piece.role === 'rook') {
                files.push(key2pos(key)[0]);
            }
        }
        return files;
    }
    function premove(pieces, key, canCastle) {
        const piece = pieces.get(key);
        if (!piece)
            return [];
        const pos = key2pos(key), r = piece.role, mobility = r === 'pawn'
            ? pawn(piece.color)
            : r === 'knight'
                ? knight
                : r === 'bishop'
                    ? bishop
                    : r === 'rook'
                        ? rook
                        : r === 'queen'
                            ? queen
                            : king(piece.color, rookFilesOf(pieces, piece.color), canCastle);
        return allPos
            .filter(pos2 => (pos[0] !== pos2[0] || pos[1] !== pos2[1]) && mobility(pos[0], pos[1], pos2[0], pos2[1]))
            .map(pos2key);
    }

    function callUserFunction(f, ...args) {
        if (f)
            setTimeout(() => f(...args), 1);
    }
    function toggleOrientation(state) {
        state.orientation = opposite(state.orientation);
        state.animation.current = state.draggable.current = state.selected = undefined;
    }
    function setPieces(state, pieces) {
        for (const [key, piece] of pieces) {
            if (piece)
                state.pieces.set(key, piece);
            else
                state.pieces.delete(key);
        }
    }
    function setCheck(state, color) {
        state.check = undefined;
        if (color === true)
            color = state.turnColor;
        if (color)
            for (const [k, p] of state.pieces) {
                if (p.role === 'king' && p.color === color) {
                    state.check = k;
                }
            }
    }
    function setPremove(state, orig, dest, meta) {
        unsetPredrop(state);
        state.premovable.current = [orig, dest];
        callUserFunction(state.premovable.events.set, orig, dest, meta);
    }
    function unsetPremove(state) {
        if (state.premovable.current) {
            state.premovable.current = undefined;
            callUserFunction(state.premovable.events.unset);
        }
    }
    function setPredrop(state, role, key) {
        unsetPremove(state);
        state.predroppable.current = { role, key };
        callUserFunction(state.predroppable.events.set, role, key);
    }
    function unsetPredrop(state) {
        const pd = state.predroppable;
        if (pd.current) {
            pd.current = undefined;
            callUserFunction(pd.events.unset);
        }
    }
    function tryAutoCastle(state, orig, dest) {
        if (!state.autoCastle)
            return false;
        const king = state.pieces.get(orig);
        if (!king || king.role !== 'king')
            return false;
        const origPos = key2pos(orig);
        const destPos = key2pos(dest);
        if ((origPos[1] !== 0 && origPos[1] !== 7) || origPos[1] !== destPos[1])
            return false;
        if (origPos[0] === 4 && !state.pieces.has(dest)) {
            if (destPos[0] === 6)
                dest = pos2key([7, destPos[1]]);
            else if (destPos[0] === 2)
                dest = pos2key([0, destPos[1]]);
        }
        const rook = state.pieces.get(dest);
        if (!rook || rook.color !== king.color || rook.role !== 'rook')
            return false;
        state.pieces.delete(orig);
        state.pieces.delete(dest);
        if (origPos[0] < destPos[0]) {
            state.pieces.set(pos2key([6, destPos[1]]), king);
            state.pieces.set(pos2key([5, destPos[1]]), rook);
        }
        else {
            state.pieces.set(pos2key([2, destPos[1]]), king);
            state.pieces.set(pos2key([3, destPos[1]]), rook);
        }
        return true;
    }
    function baseMove(state, orig, dest) {
        const origPiece = state.pieces.get(orig), destPiece = state.pieces.get(dest);
        if (orig === dest || !origPiece)
            return false;
        const captured = destPiece && destPiece.color !== origPiece.color ? destPiece : undefined;
        if (dest === state.selected)
            unselect(state);
        callUserFunction(state.events.move, orig, dest, captured);
        if (!tryAutoCastle(state, orig, dest)) {
            state.pieces.set(dest, origPiece);
            state.pieces.delete(orig);
        }
        state.lastMove = [orig, dest];
        state.check = undefined;
        callUserFunction(state.events.change);
        return captured || true;
    }
    function baseNewPiece(state, piece, key, force) {
        if (state.pieces.has(key)) {
            if (force)
                state.pieces.delete(key);
            else
                return false;
        }
        callUserFunction(state.events.dropNewPiece, piece, key);
        state.pieces.set(key, piece);
        state.lastMove = [key];
        state.check = undefined;
        callUserFunction(state.events.change);
        state.movable.dests = undefined;
        state.turnColor = opposite(state.turnColor);
        return true;
    }
    function baseUserMove(state, orig, dest) {
        const result = baseMove(state, orig, dest);
        if (result) {
            state.movable.dests = undefined;
            state.turnColor = opposite(state.turnColor);
            state.animation.current = undefined;
        }
        return result;
    }
    function userMove(state, orig, dest) {
        if (canMove(state, orig, dest)) {
            const result = baseUserMove(state, orig, dest);
            if (result) {
                const holdTime = state.hold.stop();
                unselect(state);
                const metadata = {
                    premove: false,
                    ctrlKey: state.stats.ctrlKey,
                    holdTime,
                };
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, orig, dest, metadata);
                return true;
            }
        }
        else if (canPremove(state, orig, dest)) {
            setPremove(state, orig, dest, {
                ctrlKey: state.stats.ctrlKey,
            });
            unselect(state);
            return true;
        }
        unselect(state);
        return false;
    }
    function dropNewPiece(state, orig, dest, force) {
        const piece = state.pieces.get(orig);
        if (piece && (canDrop(state, orig, dest) || force)) {
            state.pieces.delete(orig);
            baseNewPiece(state, piece, dest, force);
            callUserFunction(state.movable.events.afterNewPiece, piece.role, dest, {
                premove: false,
                predrop: false,
            });
        }
        else if (piece && canPredrop(state, orig, dest)) {
            setPredrop(state, piece.role, dest);
        }
        else {
            unsetPremove(state);
            unsetPredrop(state);
        }
        state.pieces.delete(orig);
        unselect(state);
    }
    function selectSquare(state, key, force) {
        callUserFunction(state.events.select, key);
        if (state.selected) {
            if (state.selected === key && !state.draggable.enabled) {
                unselect(state);
                state.hold.cancel();
                return;
            }
            else if ((state.selectable.enabled || force) && state.selected !== key) {
                if (userMove(state, state.selected, key)) {
                    state.stats.dragged = false;
                    return;
                }
            }
        }
        if ((state.selectable.enabled || state.draggable.enabled) && (isMovable(state, key) || isPremovable(state, key))) {
            setSelected(state, key);
            state.hold.start();
        }
    }
    function setSelected(state, key) {
        state.selected = key;
        if (isPremovable(state, key)) {
            state.premovable.dests = premove(state.pieces, key, state.premovable.castle);
        }
        else
            state.premovable.dests = undefined;
    }
    function unselect(state) {
        state.selected = undefined;
        state.premovable.dests = undefined;
        state.hold.cancel();
    }
    function isMovable(state, orig) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
    }
    const canMove = (state, orig, dest) => { var _a, _b; return orig !== dest && isMovable(state, orig) && (state.movable.free || !!((_b = (_a = state.movable.dests) === null || _a === void 0 ? void 0 : _a.get(orig)) === null || _b === void 0 ? void 0 : _b.includes(dest))); };
    function canDrop(state, orig, dest) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            (orig === dest || !state.pieces.has(dest)) &&
            (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
    }
    function isPremovable(state, orig) {
        const piece = state.pieces.get(orig);
        return !!piece && state.premovable.enabled && state.movable.color === piece.color && state.turnColor !== piece.color;
    }
    const canPremove = (state, orig, dest) => orig !== dest && isPremovable(state, orig) && premove(state.pieces, orig, state.premovable.castle).includes(dest);
    function canPredrop(state, orig, dest) {
        const piece = state.pieces.get(orig);
        const destPiece = state.pieces.get(dest);
        return (!!piece &&
            (!destPiece || destPiece.color !== state.movable.color) &&
            state.predroppable.enabled &&
            (piece.role !== 'pawn' || (dest[1] !== '1' && dest[1] !== '8')) &&
            state.movable.color === piece.color &&
            state.turnColor !== piece.color);
    }
    function isDraggable(state, orig) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            state.draggable.enabled &&
            (state.movable.color === 'both' ||
                (state.movable.color === piece.color && (state.turnColor === piece.color || state.premovable.enabled))));
    }
    function playPremove(state) {
        const move = state.premovable.current;
        if (!move)
            return false;
        const orig = move[0], dest = move[1];
        let success = false;
        if (canMove(state, orig, dest)) {
            const result = baseUserMove(state, orig, dest);
            if (result) {
                const metadata = { premove: true };
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, orig, dest, metadata);
                success = true;
            }
        }
        unsetPremove(state);
        return success;
    }
    function playPredrop(state, validate) {
        const drop = state.predroppable.current;
        let success = false;
        if (!drop)
            return false;
        if (validate(drop)) {
            const piece = {
                role: drop.role,
                color: state.movable.color,
            };
            if (baseNewPiece(state, piece, drop.key)) {
                callUserFunction(state.movable.events.afterNewPiece, drop.role, drop.key, {
                    premove: false,
                    predrop: true,
                });
                success = true;
            }
        }
        unsetPredrop(state);
        return success;
    }
    function cancelMove(state) {
        unsetPremove(state);
        unsetPredrop(state);
        unselect(state);
    }
    function stop(state) {
        state.movable.color = state.movable.dests = state.animation.current = undefined;
        cancelMove(state);
    }
    function getKeyAtDomPos(pos, asWhite, bounds) {
        let file = Math.floor((8 * (pos[0] - bounds.left)) / bounds.width);
        if (!asWhite)
            file = 7 - file;
        let rank = 7 - Math.floor((8 * (pos[1] - bounds.top)) / bounds.height);
        if (!asWhite)
            rank = 7 - rank;
        return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? pos2key([file, rank]) : undefined;
    }
    function getSnappedKeyAtDomPos(orig, pos, asWhite, bounds) {
        const origPos = key2pos(orig);
        const validSnapPos = allPos.filter(pos2 => queen(origPos[0], origPos[1], pos2[0], pos2[1]) || knight(origPos[0], origPos[1], pos2[0], pos2[1]));
        const validSnapCenters = validSnapPos.map(pos2 => computeSquareCenter(pos2key(pos2), asWhite, bounds));
        const validSnapDistances = validSnapCenters.map(pos2 => distanceSq(pos, pos2));
        const [, closestSnapIndex] = validSnapDistances.reduce((a, b, index) => (a[0] < b ? a : [b, index]), [validSnapDistances[0], 0]);
        return pos2key(validSnapPos[closestSnapIndex]);
    }
    const whitePov = (s) => s.orientation === 'white';

    const initial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const roles = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
    };
    const letters = {
        pawn: 'p',
        rook: 'r',
        knight: 'n',
        bishop: 'b',
        queen: 'q',
        king: 'k',
    };
    function read(fen) {
        if (fen === 'start')
            fen = initial;
        const pieces = new Map();
        let row = 7, col = 0;
        for (const c of fen) {
            switch (c) {
                case ' ':
                case '[':
                    return pieces;
                case '/':
                    --row;
                    if (row < 0)
                        return pieces;
                    col = 0;
                    break;
                case '~': {
                    const piece = pieces.get(pos2key([col - 1, row]));
                    if (piece)
                        piece.promoted = true;
                    break;
                }
                default: {
                    const nb = c.charCodeAt(0);
                    if (nb < 57)
                        col += nb - 48;
                    else {
                        const role = c.toLowerCase();
                        pieces.set(pos2key([col, row]), {
                            role: roles[role],
                            color: c === role ? 'black' : 'white',
                        });
                        ++col;
                    }
                }
            }
        }
        return pieces;
    }
    function write(pieces) {
        return invRanks
            .map(y => files
            .map(x => {
            const piece = pieces.get((x + y));
            if (piece) {
                let p = letters[piece.role];
                if (piece.color === 'white')
                    p = p.toUpperCase();
                if (piece.promoted)
                    p += '~';
                return p;
            }
            else
                return '1';
        })
            .join(''))
            .join('/')
            .replace(/1{2,}/g, s => s.length.toString());
    }

    function applyAnimation(state, config) {
        if (config.animation) {
            deepMerge(state.animation, config.animation);
            // no need for such short animations
            if ((state.animation.duration || 0) < 70)
                state.animation.enabled = false;
        }
    }
    function configure(state, config) {
        var _a, _b, _c;
        // don't merge destinations and autoShapes. Just override.
        if ((_a = config.movable) === null || _a === void 0 ? void 0 : _a.dests)
            state.movable.dests = undefined;
        if ((_b = config.drawable) === null || _b === void 0 ? void 0 : _b.autoShapes)
            state.drawable.autoShapes = [];
        deepMerge(state, config);
        // if a fen was provided, replace the pieces
        if (config.fen) {
            state.pieces = read(config.fen);
            state.drawable.shapes = ((_c = config.drawable) === null || _c === void 0 ? void 0 : _c.shapes) || [];
        }
        // apply config values that could be undefined yet meaningful
        if ('check' in config)
            setCheck(state, config.check || false);
        if ('lastMove' in config && !config.lastMove)
            state.lastMove = undefined;
        // in case of ZH drop last move, there's a single square.
        // if the previous last move had two squares,
        // the merge algorithm will incorrectly keep the second square.
        else if (config.lastMove)
            state.lastMove = config.lastMove;
        // fix move/premove dests
        if (state.selected)
            setSelected(state, state.selected);
        applyAnimation(state, config);
        if (!state.movable.rookCastle && state.movable.dests) {
            const rank = state.movable.color === 'white' ? '1' : '8', kingStartPos = ('e' + rank), dests = state.movable.dests.get(kingStartPos), king = state.pieces.get(kingStartPos);
            if (!dests || !king || king.role !== 'king')
                return;
            state.movable.dests.set(kingStartPos, dests.filter(d => !(d === 'a' + rank && dests.includes(('c' + rank))) &&
                !(d === 'h' + rank && dests.includes(('g' + rank)))));
        }
    }
    function deepMerge(base, extend) {
        for (const key in extend) {
            if (Object.prototype.hasOwnProperty.call(extend, key)) {
                if (Object.prototype.hasOwnProperty.call(base, key) && isPlainObject(base[key]) && isPlainObject(extend[key]))
                    deepMerge(base[key], extend[key]);
                else
                    base[key] = extend[key];
            }
        }
    }
    function isPlainObject(o) {
        if (typeof o !== 'object' || o === null)
            return false;
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
    }

    const anim = (mutation, state) => state.animation.enabled ? animate(mutation, state) : render$2(mutation, state);
    function render$2(mutation, state) {
        const result = mutation(state);
        state.dom.redraw();
        return result;
    }
    const makePiece = (key, piece) => ({
        key: key,
        pos: key2pos(key),
        piece: piece,
    });
    const closer = (piece, pieces) => pieces.sort((p1, p2) => distanceSq(piece.pos, p1.pos) - distanceSq(piece.pos, p2.pos))[0];
    function computePlan(prevPieces, current) {
        const anims = new Map(), animedOrigs = [], fadings = new Map(), missings = [], news = [], prePieces = new Map();
        let curP, preP, vector;
        for (const [k, p] of prevPieces) {
            prePieces.set(k, makePiece(k, p));
        }
        for (const key of allKeys) {
            curP = current.pieces.get(key);
            preP = prePieces.get(key);
            if (curP) {
                if (preP) {
                    if (!samePiece(curP, preP.piece)) {
                        missings.push(preP);
                        news.push(makePiece(key, curP));
                    }
                }
                else
                    news.push(makePiece(key, curP));
            }
            else if (preP)
                missings.push(preP);
        }
        for (const newP of news) {
            preP = closer(newP, missings.filter(p => samePiece(newP.piece, p.piece)));
            if (preP) {
                vector = [preP.pos[0] - newP.pos[0], preP.pos[1] - newP.pos[1]];
                anims.set(newP.key, vector.concat(vector));
                animedOrigs.push(preP.key);
            }
        }
        for (const p of missings) {
            if (!animedOrigs.includes(p.key))
                fadings.set(p.key, p.piece);
        }
        return {
            anims: anims,
            fadings: fadings,
        };
    }
    function step(state, now) {
        const cur = state.animation.current;
        if (cur === undefined) {
            // animation was canceled :(
            if (!state.dom.destroyed)
                state.dom.redrawNow();
            return;
        }
        const rest = 1 - (now - cur.start) * cur.frequency;
        if (rest <= 0) {
            state.animation.current = undefined;
            state.dom.redrawNow();
        }
        else {
            const ease = easing(rest);
            for (const cfg of cur.plan.anims.values()) {
                cfg[2] = cfg[0] * ease;
                cfg[3] = cfg[1] * ease;
            }
            state.dom.redrawNow(true); // optimisation: don't render SVG changes during animations
            requestAnimationFrame((now = performance.now()) => step(state, now));
        }
    }
    function animate(mutation, state) {
        // clone state before mutating it
        const prevPieces = new Map(state.pieces);
        const result = mutation(state);
        const plan = computePlan(prevPieces, state);
        if (plan.anims.size || plan.fadings.size) {
            const alreadyRunning = state.animation.current && state.animation.current.start;
            state.animation.current = {
                start: performance.now(),
                frequency: 1 / state.animation.duration,
                plan: plan,
            };
            if (!alreadyRunning)
                step(state, performance.now());
        }
        else {
            // don't animate, just render right away
            state.dom.redraw();
        }
        return result;
    }
    // https://gist.github.com/gre/1650294
    const easing = (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);

    const brushes = ['green', 'red', 'blue', 'yellow'];
    function start$2(state, e) {
        // support one finger touch only
        if (e.touches && e.touches.length > 1)
            return;
        e.stopPropagation();
        e.preventDefault();
        e.ctrlKey ? unselect(state) : cancelMove(state);
        const pos = eventPosition(e), orig = getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
        if (!orig)
            return;
        state.drawable.current = {
            orig,
            pos,
            brush: eventBrush(e),
            snapToValidMove: state.drawable.defaultSnapToValidMove,
        };
        processDraw(state);
    }
    function processDraw(state) {
        requestAnimationFrame(() => {
            const cur = state.drawable.current;
            if (cur) {
                const keyAtDomPos = getKeyAtDomPos(cur.pos, whitePov(state), state.dom.bounds());
                if (!keyAtDomPos) {
                    cur.snapToValidMove = false;
                }
                const mouseSq = cur.snapToValidMove
                    ? getSnappedKeyAtDomPos(cur.orig, cur.pos, whitePov(state), state.dom.bounds())
                    : keyAtDomPos;
                if (mouseSq !== cur.mouseSq) {
                    cur.mouseSq = mouseSq;
                    cur.dest = mouseSq !== cur.orig ? mouseSq : undefined;
                    state.dom.redrawNow();
                }
                processDraw(state);
            }
        });
    }
    function move$1(state, e) {
        if (state.drawable.current)
            state.drawable.current.pos = eventPosition(e);
    }
    function end$1(state) {
        const cur = state.drawable.current;
        if (cur) {
            if (cur.mouseSq)
                addShape(state.drawable, cur);
            cancel$1(state);
        }
    }
    function cancel$1(state) {
        if (state.drawable.current) {
            state.drawable.current = undefined;
            state.dom.redraw();
        }
    }
    function clear(state) {
        if (state.drawable.shapes.length) {
            state.drawable.shapes = [];
            state.dom.redraw();
            onChange(state.drawable);
        }
    }
    function eventBrush(e) {
        var _a;
        const modA = (e.shiftKey || e.ctrlKey) && isRightButton(e);
        const modB = e.altKey || e.metaKey || ((_a = e.getModifierState) === null || _a === void 0 ? void 0 : _a.call(e, 'AltGraph'));
        return brushes[(modA ? 1 : 0) + (modB ? 2 : 0)];
    }
    function addShape(drawable, cur) {
        const sameShape = (s) => s.orig === cur.orig && s.dest === cur.dest;
        const similar = drawable.shapes.find(sameShape);
        if (similar)
            drawable.shapes = drawable.shapes.filter(s => !sameShape(s));
        if (!similar || similar.brush !== cur.brush)
            drawable.shapes.push({
                orig: cur.orig,
                dest: cur.dest,
                brush: cur.brush,
            });
        onChange(drawable);
    }
    function onChange(drawable) {
        if (drawable.onChange)
            drawable.onChange(drawable.shapes);
    }

    function start$1(s, e) {
        if (!e.isTrusted || (e.button !== undefined && e.button !== 0))
            return; // only touch or left click
        if (e.touches && e.touches.length > 1)
            return; // support one finger touch only
        const bounds = s.dom.bounds(), position = eventPosition(e), orig = getKeyAtDomPos(position, whitePov(s), bounds);
        if (!orig)
            return;
        const piece = s.pieces.get(orig);
        const previouslySelected = s.selected;
        if (!previouslySelected && s.drawable.enabled && (s.drawable.eraseOnClick || !piece || piece.color !== s.turnColor))
            clear(s);
        // Prevent touch scroll and create no corresponding mouse event, if there
        // is an intent to interact with the board.
        if (e.cancelable !== false &&
            (!e.touches || s.blockTouchScroll || piece || previouslySelected || pieceCloseTo(s, position)))
            e.preventDefault();
        const hadPremove = !!s.premovable.current;
        const hadPredrop = !!s.predroppable.current;
        s.stats.ctrlKey = e.ctrlKey;
        if (s.selected && canMove(s, s.selected, orig)) {
            anim(state => selectSquare(state, orig), s);
        }
        else {
            selectSquare(s, orig);
        }
        const stillSelected = s.selected === orig;
        const element = pieceElementByKey(s, orig);
        if (piece && element && stillSelected && isDraggable(s, orig)) {
            s.draggable.current = {
                orig,
                piece,
                origPos: position,
                pos: position,
                started: s.draggable.autoDistance && s.stats.dragged,
                element,
                previouslySelected,
                originTarget: e.target,
                keyHasChanged: false,
            };
            element.cgDragging = true;
            element.classList.add('dragging');
            // place ghost
            const ghost = s.dom.elements.ghost;
            if (ghost) {
                ghost.className = `ghost ${piece.color} ${piece.role}`;
                translate(ghost, posToTranslate(bounds)(key2pos(orig), whitePov(s)));
                setVisible(ghost, true);
            }
            processDrag(s);
        }
        else {
            if (hadPremove)
                unsetPremove(s);
            if (hadPredrop)
                unsetPredrop(s);
        }
        s.dom.redraw();
    }
    function pieceCloseTo(s, pos) {
        const asWhite = whitePov(s), bounds = s.dom.bounds(), radiusSq = Math.pow(bounds.width / 8, 2);
        for (const key of s.pieces.keys()) {
            const center = computeSquareCenter(key, asWhite, bounds);
            if (distanceSq(center, pos) <= radiusSq)
                return true;
        }
        return false;
    }
    function dragNewPiece(s, piece, e, force) {
        const key = 'a0';
        s.pieces.set(key, piece);
        s.dom.redraw();
        const position = eventPosition(e);
        s.draggable.current = {
            orig: key,
            piece,
            origPos: position,
            pos: position,
            started: true,
            element: () => pieceElementByKey(s, key),
            originTarget: e.target,
            newPiece: true,
            force: !!force,
            keyHasChanged: false,
        };
        processDrag(s);
    }
    function processDrag(s) {
        requestAnimationFrame(() => {
            var _a;
            const cur = s.draggable.current;
            if (!cur)
                return;
            // cancel animations while dragging
            if ((_a = s.animation.current) === null || _a === void 0 ? void 0 : _a.plan.anims.has(cur.orig))
                s.animation.current = undefined;
            // if moving piece is gone, cancel
            const origPiece = s.pieces.get(cur.orig);
            if (!origPiece || !samePiece(origPiece, cur.piece))
                cancel(s);
            else {
                if (!cur.started && distanceSq(cur.pos, cur.origPos) >= Math.pow(s.draggable.distance, 2))
                    cur.started = true;
                if (cur.started) {
                    // support lazy elements
                    if (typeof cur.element === 'function') {
                        const found = cur.element();
                        if (!found)
                            return;
                        found.cgDragging = true;
                        found.classList.add('dragging');
                        cur.element = found;
                    }
                    const bounds = s.dom.bounds();
                    translate(cur.element, [
                        cur.pos[0] - bounds.left - bounds.width / 16,
                        cur.pos[1] - bounds.top - bounds.height / 16,
                    ]);
                    cur.keyHasChanged || (cur.keyHasChanged = cur.orig !== getKeyAtDomPos(cur.pos, whitePov(s), bounds));
                }
            }
            processDrag(s);
        });
    }
    function move(s, e) {
        // support one finger touch only
        if (s.draggable.current && (!e.touches || e.touches.length < 2)) {
            s.draggable.current.pos = eventPosition(e);
        }
    }
    function end(s, e) {
        const cur = s.draggable.current;
        if (!cur)
            return;
        // create no corresponding mouse event
        if (e.type === 'touchend' && e.cancelable !== false)
            e.preventDefault();
        // comparing with the origin target is an easy way to test that the end event
        // has the same touch origin
        if (e.type === 'touchend' && cur.originTarget !== e.target && !cur.newPiece) {
            s.draggable.current = undefined;
            return;
        }
        unsetPremove(s);
        unsetPredrop(s);
        // touchend has no position; so use the last touchmove position instead
        const eventPos = eventPosition(e) || cur.pos;
        const dest = getKeyAtDomPos(eventPos, whitePov(s), s.dom.bounds());
        if (dest && cur.started && cur.orig !== dest) {
            if (cur.newPiece)
                dropNewPiece(s, cur.orig, dest, cur.force);
            else {
                s.stats.ctrlKey = e.ctrlKey;
                if (userMove(s, cur.orig, dest))
                    s.stats.dragged = true;
            }
        }
        else if (cur.newPiece) {
            s.pieces.delete(cur.orig);
        }
        else if (s.draggable.deleteOnDropOff && !dest) {
            s.pieces.delete(cur.orig);
            callUserFunction(s.events.change);
        }
        if ((cur.orig === cur.previouslySelected || cur.keyHasChanged) && (cur.orig === dest || !dest))
            unselect(s);
        else if (!s.selectable.enabled)
            unselect(s);
        removeDragElements(s);
        s.draggable.current = undefined;
        s.dom.redraw();
    }
    function cancel(s) {
        const cur = s.draggable.current;
        if (cur) {
            if (cur.newPiece)
                s.pieces.delete(cur.orig);
            s.draggable.current = undefined;
            unselect(s);
            removeDragElements(s);
            s.dom.redraw();
        }
    }
    function removeDragElements(s) {
        const e = s.dom.elements;
        if (e.ghost)
            setVisible(e.ghost, false);
    }
    function pieceElementByKey(s, key) {
        let el = s.dom.elements.board.firstChild;
        while (el) {
            if (el.cgKey === key && el.tagName === 'PIECE')
                return el;
            el = el.nextSibling;
        }
        return;
    }

    function explosion(state, keys) {
        state.exploding = { stage: 1, keys };
        state.dom.redraw();
        setTimeout(() => {
            setStage(state, 2);
            setTimeout(() => setStage(state, undefined), 120);
        }, 120);
    }
    function setStage(state, stage) {
        if (state.exploding) {
            if (stage)
                state.exploding.stage = stage;
            else
                state.exploding = undefined;
            state.dom.redraw();
        }
    }

    // see API types and documentations in dts/api.d.ts
    function start(state, redrawAll) {
        function toggleOrientation$1() {
            toggleOrientation(state);
            redrawAll();
        }
        return {
            set(config) {
                if (config.orientation && config.orientation !== state.orientation)
                    toggleOrientation$1();
                applyAnimation(state, config);
                (config.fen ? anim : render$2)(state => configure(state, config), state);
            },
            state,
            getFen: () => write(state.pieces),
            toggleOrientation: toggleOrientation$1,
            setPieces(pieces) {
                anim(state => setPieces(state, pieces), state);
            },
            selectSquare(key, force) {
                if (key)
                    anim(state => selectSquare(state, key, force), state);
                else if (state.selected) {
                    unselect(state);
                    state.dom.redraw();
                }
            },
            move(orig, dest) {
                anim(state => baseMove(state, orig, dest), state);
            },
            newPiece(piece, key) {
                anim(state => baseNewPiece(state, piece, key), state);
            },
            playPremove() {
                if (state.premovable.current) {
                    if (anim(playPremove, state))
                        return true;
                    // if the premove couldn't be played, redraw to clear it up
                    state.dom.redraw();
                }
                return false;
            },
            playPredrop(validate) {
                if (state.predroppable.current) {
                    const result = playPredrop(state, validate);
                    state.dom.redraw();
                    return result;
                }
                return false;
            },
            cancelPremove() {
                render$2(unsetPremove, state);
            },
            cancelPredrop() {
                render$2(unsetPredrop, state);
            },
            cancelMove() {
                render$2(state => {
                    cancelMove(state);
                    cancel(state);
                }, state);
            },
            stop() {
                render$2(state => {
                    stop(state);
                    cancel(state);
                }, state);
            },
            explode(keys) {
                explosion(state, keys);
            },
            setAutoShapes(shapes) {
                render$2(state => (state.drawable.autoShapes = shapes), state);
            },
            setShapes(shapes) {
                render$2(state => (state.drawable.shapes = shapes), state);
            },
            getKeyAtDomPos(pos) {
                return getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
            },
            redrawAll,
            dragNewPiece(piece, event, force) {
                dragNewPiece(state, piece, event, force);
            },
            destroy() {
                stop(state);
                state.dom.unbind && state.dom.unbind();
                state.dom.destroyed = true;
            },
        };
    }

    function defaults() {
        return {
            pieces: read(initial),
            orientation: 'white',
            turnColor: 'white',
            coordinates: true,
            ranksPosition: 'right',
            autoCastle: true,
            viewOnly: false,
            disableContextMenu: false,
            addPieceZIndex: false,
            blockTouchScroll: false,
            pieceKey: false,
            highlight: {
                lastMove: true,
                check: true,
            },
            animation: {
                enabled: true,
                duration: 200,
            },
            movable: {
                free: true,
                color: 'both',
                showDests: true,
                events: {},
                rookCastle: true,
            },
            premovable: {
                enabled: true,
                showDests: true,
                castle: true,
                events: {},
            },
            predroppable: {
                enabled: false,
                events: {},
            },
            draggable: {
                enabled: true,
                distance: 3,
                autoDistance: true,
                showGhost: true,
                deleteOnDropOff: false,
            },
            dropmode: {
                active: false,
            },
            selectable: {
                enabled: true,
            },
            stats: {
                // on touchscreen, default to "tap-tap" moves
                // instead of drag
                dragged: !('ontouchstart' in window),
            },
            events: {},
            drawable: {
                enabled: true,
                visible: true,
                defaultSnapToValidMove: true,
                eraseOnClick: true,
                shapes: [],
                autoShapes: [],
                brushes: {
                    green: { key: 'g', color: '#15781B', opacity: 1, lineWidth: 10 },
                    red: { key: 'r', color: '#882020', opacity: 1, lineWidth: 10 },
                    blue: { key: 'b', color: '#003088', opacity: 1, lineWidth: 10 },
                    yellow: { key: 'y', color: '#e68f00', opacity: 1, lineWidth: 10 },
                    paleBlue: { key: 'pb', color: '#003088', opacity: 0.4, lineWidth: 15 },
                    paleGreen: { key: 'pg', color: '#15781B', opacity: 0.4, lineWidth: 15 },
                    paleRed: { key: 'pr', color: '#882020', opacity: 0.4, lineWidth: 15 },
                    paleGrey: {
                        key: 'pgr',
                        color: '#4a4a4a',
                        opacity: 0.35,
                        lineWidth: 15,
                    },
                },
                prevSvgHash: '',
            },
            hold: timer(),
        };
    }

    // append and remove only. No updates.
    function syncShapes(shapes, root, renderShape) {
        const hashesInDom = new Map(), // by hash
        toRemove = [];
        for (const sc of shapes)
            hashesInDom.set(sc.hash, false);
        let el = root.firstChild, elHash;
        while (el) {
            elHash = el.getAttribute('cgHash');
            // found a shape element that's here to stay
            if (hashesInDom.has(elHash))
                hashesInDom.set(elHash, true);
            // or remove it
            else
                toRemove.push(el);
            el = el.nextSibling;
        }
        // remove old shapes
        for (const el of toRemove)
            root.removeChild(el);
        // insert shapes that are not yet in dom
        for (const sc of shapes) {
            if (!hashesInDom.get(sc.hash))
                root.appendChild(renderShape(sc));
        }
    }

    function createElement(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }
    function renderSvg(state, svg, customSvg) {
        const d = state.drawable, curD = d.current, cur = curD && curD.mouseSq ? curD : undefined, arrowDests = new Map(), bounds = state.dom.bounds(), nonPieceAutoShapes = d.autoShapes.filter(autoShape => !autoShape.piece);
        for (const s of d.shapes.concat(nonPieceAutoShapes).concat(cur ? [cur] : [])) {
            if (s.dest)
                arrowDests.set(s.dest, (arrowDests.get(s.dest) || 0) + 1);
        }
        const shapes = d.shapes.concat(nonPieceAutoShapes).map((s) => {
            return {
                shape: s,
                current: false,
                hash: shapeHash(s, arrowDests, false, bounds),
            };
        });
        if (cur)
            shapes.push({
                shape: cur,
                current: true,
                hash: shapeHash(cur, arrowDests, true, bounds),
            });
        const fullHash = shapes.map(sc => sc.hash).join(';');
        if (fullHash === state.drawable.prevSvgHash)
            return;
        state.drawable.prevSvgHash = fullHash;
        /*
          -- DOM hierarchy --
          <svg class="cg-shapes">      (<= svg)
            <defs>
              ...(for brushes)...
            </defs>
            <g>
              ...(for arrows and circles)...
            </g>
          </svg>
          <svg class="cg-custom-svgs"> (<= customSvg)
            <g>
              ...(for custom svgs)...
            </g>
          </svg>
        */
        const defsEl = svg.querySelector('defs');
        const shapesEl = svg.querySelector('g');
        const customSvgsEl = customSvg.querySelector('g');
        syncDefs(d, shapes, defsEl);
        syncShapes(shapes.filter(s => !s.shape.customSvg), shapesEl, shape => renderShape$1(state, shape, d.brushes, arrowDests, bounds));
        syncShapes(shapes.filter(s => s.shape.customSvg), customSvgsEl, shape => renderShape$1(state, shape, d.brushes, arrowDests, bounds));
    }
    // append only. Don't try to update/remove.
    function syncDefs(d, shapes, defsEl) {
        const brushes = new Map();
        let brush;
        for (const s of shapes) {
            if (s.shape.dest) {
                brush = d.brushes[s.shape.brush];
                if (s.shape.modifiers)
                    brush = makeCustomBrush(brush, s.shape.modifiers);
                brushes.set(brush.key, brush);
            }
        }
        const keysInDom = new Set();
        let el = defsEl.firstChild;
        while (el) {
            keysInDom.add(el.getAttribute('cgKey'));
            el = el.nextSibling;
        }
        for (const [key, brush] of brushes.entries()) {
            if (!keysInDom.has(key))
                defsEl.appendChild(renderMarker(brush));
        }
    }
    function shapeHash({ orig, dest, brush, piece, modifiers, customSvg }, arrowDests, current, bounds) {
        return [
            bounds.width,
            bounds.height,
            current,
            orig,
            dest,
            brush,
            dest && (arrowDests.get(dest) || 0) > 1,
            piece && pieceHash(piece),
            modifiers && modifiersHash(modifiers),
            customSvg && customSvgHash(customSvg),
        ]
            .filter(x => x)
            .join(',');
    }
    function pieceHash(piece) {
        return [piece.color, piece.role, piece.scale].filter(x => x).join(',');
    }
    function modifiersHash(m) {
        return '' + (m.lineWidth || '');
    }
    function customSvgHash(s) {
        // Rolling hash with base 31 (cf. https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript)
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h + s.charCodeAt(i)) >>> 0;
        }
        return 'custom-' + h.toString();
    }
    function renderShape$1(state, { shape, current, hash }, brushes, arrowDests, bounds) {
        let el;
        const orig = orient(key2pos(shape.orig), state.orientation);
        if (shape.customSvg) {
            el = renderCustomSvg(shape.customSvg, orig, bounds);
        }
        else {
            if (shape.dest) {
                let brush = brushes[shape.brush];
                if (shape.modifiers)
                    brush = makeCustomBrush(brush, shape.modifiers);
                el = renderArrow(brush, orig, orient(key2pos(shape.dest), state.orientation), current, (arrowDests.get(shape.dest) || 0) > 1, bounds);
            }
            else
                el = renderCircle(brushes[shape.brush], orig, current, bounds);
        }
        el.setAttribute('cgHash', hash);
        return el;
    }
    function renderCustomSvg(customSvg, pos, bounds) {
        const [x, y] = pos2user(pos, bounds);
        // Translate to top-left of `orig` square
        const g = setAttributes(createElement('g'), { transform: `translate(${x},${y})` });
        // Give 100x100 coordinate system to the user for `orig` square
        const svg = setAttributes(createElement('svg'), { width: 1, height: 1, viewBox: '0 0 100 100' });
        g.appendChild(svg);
        svg.innerHTML = customSvg;
        return g;
    }
    function renderCircle(brush, pos, current, bounds) {
        const o = pos2user(pos, bounds), widths = circleWidth(), radius = (bounds.width + bounds.height) / (4 * Math.max(bounds.width, bounds.height));
        return setAttributes(createElement('circle'), {
            stroke: brush.color,
            'stroke-width': widths[current ? 0 : 1],
            fill: 'none',
            opacity: opacity(brush, current),
            cx: o[0],
            cy: o[1],
            r: radius - widths[1] / 2,
        });
    }
    function renderArrow(brush, orig, dest, current, shorten, bounds) {
        const m = arrowMargin(shorten && !current), a = pos2user(orig, bounds), b = pos2user(dest, bounds), dx = b[0] - a[0], dy = b[1] - a[1], angle = Math.atan2(dy, dx), xo = Math.cos(angle) * m, yo = Math.sin(angle) * m;
        return setAttributes(createElement('line'), {
            stroke: brush.color,
            'stroke-width': lineWidth(brush, current),
            'stroke-linecap': 'round',
            'marker-end': 'url(#arrowhead-' + brush.key + ')',
            opacity: opacity(brush, current),
            x1: a[0],
            y1: a[1],
            x2: b[0] - xo,
            y2: b[1] - yo,
        });
    }
    function renderMarker(brush) {
        const marker = setAttributes(createElement('marker'), {
            id: 'arrowhead-' + brush.key,
            orient: 'auto',
            markerWidth: 4,
            markerHeight: 8,
            refX: 2.05,
            refY: 2.01,
        });
        marker.appendChild(setAttributes(createElement('path'), {
            d: 'M0,0 V4 L3,2 Z',
            fill: brush.color,
        }));
        marker.setAttribute('cgKey', brush.key);
        return marker;
    }
    function setAttributes(el, attrs) {
        for (const key in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, key))
                el.setAttribute(key, attrs[key]);
        }
        return el;
    }
    function orient(pos, color) {
        return color === 'white' ? pos : [7 - pos[0], 7 - pos[1]];
    }
    function makeCustomBrush(base, modifiers) {
        return {
            color: base.color,
            opacity: Math.round(base.opacity * 10) / 10,
            lineWidth: Math.round(modifiers.lineWidth || base.lineWidth),
            key: [base.key, modifiers.lineWidth].filter(x => x).join(''),
        };
    }
    function circleWidth() {
        return [3 / 64, 4 / 64];
    }
    function lineWidth(brush, current) {
        return ((brush.lineWidth || 10) * (current ? 0.85 : 1)) / 64;
    }
    function opacity(brush, current) {
        return (brush.opacity || 1) * (current ? 0.9 : 1);
    }
    function arrowMargin(shorten) {
        return (shorten ? 20 : 10) / 64;
    }
    function pos2user(pos, bounds) {
        const xScale = Math.min(1, bounds.width / bounds.height);
        const yScale = Math.min(1, bounds.height / bounds.width);
        return [(pos[0] - 3.5) * xScale, (3.5 - pos[1]) * yScale];
    }

    function renderWrap(element, s) {
        // .cg-wrap (element passed to Chessground)
        //   cg-container
        //     cg-board
        //     svg.cg-shapes
        //       defs
        //       g
        //     svg.cg-custom-svgs
        //       g
        //     cg-auto-pieces
        //     coords.ranks
        //     coords.files
        //     piece.ghost
        element.innerHTML = '';
        // ensure the cg-wrap class is set
        // so bounds calculation can use the CSS width/height values
        // add that class yourself to the element before calling chessground
        // for a slight performance improvement! (avoids recomputing style)
        element.classList.add('cg-wrap');
        for (const c of colors)
            element.classList.toggle('orientation-' + c, s.orientation === c);
        element.classList.toggle('manipulable', !s.viewOnly);
        const container = createEl('cg-container');
        element.appendChild(container);
        const board = createEl('cg-board');
        container.appendChild(board);
        let svg;
        let customSvg;
        let autoPieces;
        if (s.drawable.visible) {
            svg = setAttributes(createElement('svg'), {
                class: 'cg-shapes',
                viewBox: '-4 -4 8 8',
                preserveAspectRatio: 'xMidYMid slice',
            });
            svg.appendChild(createElement('defs'));
            svg.appendChild(createElement('g'));
            customSvg = setAttributes(createElement('svg'), {
                class: 'cg-custom-svgs',
                viewBox: '-3.5 -3.5 8 8',
                preserveAspectRatio: 'xMidYMid slice',
            });
            customSvg.appendChild(createElement('g'));
            autoPieces = createEl('cg-auto-pieces');
            container.appendChild(svg);
            container.appendChild(customSvg);
            container.appendChild(autoPieces);
        }
        if (s.coordinates) {
            const orientClass = s.orientation === 'black' ? ' black' : '';
            const ranksPositionClass = s.ranksPosition === 'left' ? ' left' : '';
            container.appendChild(renderCoords(ranks, 'ranks' + orientClass + ranksPositionClass));
            container.appendChild(renderCoords(files, 'files' + orientClass));
        }
        let ghost;
        if (s.draggable.enabled && s.draggable.showGhost) {
            ghost = createEl('piece', 'ghost');
            setVisible(ghost, false);
            container.appendChild(ghost);
        }
        return {
            board,
            container,
            wrap: element,
            ghost,
            svg,
            customSvg,
            autoPieces,
        };
    }
    function renderCoords(elems, className) {
        const el = createEl('coords', className);
        let f;
        for (const elem of elems) {
            f = createEl('coord');
            f.textContent = elem;
            el.appendChild(f);
        }
        return el;
    }

    function drop(s, e) {
        if (!s.dropmode.active)
            return;
        unsetPremove(s);
        unsetPredrop(s);
        const piece = s.dropmode.piece;
        if (piece) {
            s.pieces.set('a0', piece);
            const position = eventPosition(e);
            const dest = position && getKeyAtDomPos(position, whitePov(s), s.dom.bounds());
            if (dest)
                dropNewPiece(s, 'a0', dest);
        }
        s.dom.redraw();
    }

    function bindBoard(s, onResize) {
        const boardEl = s.dom.elements.board;
        if ('ResizeObserver' in window)
            new ResizeObserver(onResize).observe(s.dom.elements.wrap);
        if (s.disableContextMenu || s.drawable.enabled) {
            boardEl.addEventListener('contextmenu', e => e.preventDefault());
        }
        if (s.viewOnly)
            return;
        // Cannot be passive, because we prevent touch scrolling and dragging of
        // selected elements.
        const onStart = startDragOrDraw(s);
        boardEl.addEventListener('touchstart', onStart, {
            passive: false,
        });
        boardEl.addEventListener('mousedown', onStart, {
            passive: false,
        });
    }
    // returns the unbind function
    function bindDocument(s, onResize) {
        const unbinds = [];
        // Old versions of Edge and Safari do not support ResizeObserver. Send
        // chessground.resize if a user action has changed the bounds of the board.
        if (!('ResizeObserver' in window))
            unbinds.push(unbindable(document.body, 'chessground.resize', onResize));
        if (!s.viewOnly) {
            const onmove = dragOrDraw(s, move, move$1);
            const onend = dragOrDraw(s, end, end$1);
            for (const ev of ['touchmove', 'mousemove'])
                unbinds.push(unbindable(document, ev, onmove));
            for (const ev of ['touchend', 'mouseup'])
                unbinds.push(unbindable(document, ev, onend));
            const onScroll = () => s.dom.bounds.clear();
            unbinds.push(unbindable(document, 'scroll', onScroll, { capture: true, passive: true }));
            unbinds.push(unbindable(window, 'resize', onScroll, { passive: true }));
        }
        return () => unbinds.forEach(f => f());
    }
    function unbindable(el, eventName, callback, options) {
        el.addEventListener(eventName, callback, options);
        return () => el.removeEventListener(eventName, callback, options);
    }
    const startDragOrDraw = (s) => e => {
        if (s.draggable.current)
            cancel(s);
        else if (s.drawable.current)
            cancel$1(s);
        else if (e.shiftKey || isRightButton(e)) {
            if (s.drawable.enabled)
                start$2(s, e);
        }
        else if (!s.viewOnly) {
            if (s.dropmode.active)
                drop(s, e);
            else
                start$1(s, e);
        }
    };
    const dragOrDraw = (s, withDrag, withDraw) => e => {
        if (s.drawable.current) {
            if (s.drawable.enabled)
                withDraw(s, e);
        }
        else if (!s.viewOnly)
            withDrag(s, e);
    };

    // ported from https://github.com/lichess-org/lichobile/blob/master/src/chessground/render.ts
    // in case of bugs, blame @veloce
    function render$1(s) {
        const asWhite = whitePov(s), posToTranslate$1 = posToTranslate(s.dom.bounds()), boardEl = s.dom.elements.board, pieces = s.pieces, curAnim = s.animation.current, anims = curAnim ? curAnim.plan.anims : new Map(), fadings = curAnim ? curAnim.plan.fadings : new Map(), curDrag = s.draggable.current, squares = computeSquareClasses(s), samePieces = new Set(), sameSquares = new Set(), movedPieces = new Map(), movedSquares = new Map(); // by class name
        let k, el, pieceAtKey, elPieceName, anim, fading, pMvdset, pMvd, sMvdset, sMvd;
        // walk over all board dom elements, apply animations and flag moved pieces
        el = boardEl.firstChild;
        while (el) {
            k = el.cgKey;
            if (isPieceNode(el)) {
                pieceAtKey = pieces.get(k);
                anim = anims.get(k);
                fading = fadings.get(k);
                elPieceName = el.cgPiece;
                // if piece not being dragged anymore, remove dragging style
                if (el.cgDragging && (!curDrag || curDrag.orig !== k)) {
                    el.classList.remove('dragging');
                    translate(el, posToTranslate$1(key2pos(k), asWhite));
                    el.cgDragging = false;
                }
                // remove fading class if it still remains
                if (!fading && el.cgFading) {
                    el.cgFading = false;
                    el.classList.remove('fading');
                }
                // there is now a piece at this dom key
                if (pieceAtKey) {
                    // continue animation if already animating and same piece
                    // (otherwise it could animate a captured piece)
                    if (anim && el.cgAnimating && elPieceName === pieceNameOf(pieceAtKey)) {
                        const pos = key2pos(k);
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                        el.classList.add('anim');
                        translate(el, posToTranslate$1(pos, asWhite));
                    }
                    else if (el.cgAnimating) {
                        el.cgAnimating = false;
                        el.classList.remove('anim');
                        translate(el, posToTranslate$1(key2pos(k), asWhite));
                        if (s.addPieceZIndex)
                            el.style.zIndex = posZIndex(key2pos(k), asWhite);
                    }
                    // same piece: flag as same
                    if (elPieceName === pieceNameOf(pieceAtKey) && (!fading || !el.cgFading)) {
                        samePieces.add(k);
                    }
                    // different piece: flag as moved unless it is a fading piece
                    else {
                        if (fading && elPieceName === pieceNameOf(fading)) {
                            el.classList.add('fading');
                            el.cgFading = true;
                        }
                        else {
                            appendValue(movedPieces, elPieceName, el);
                        }
                    }
                }
                // no piece: flag as moved
                else {
                    appendValue(movedPieces, elPieceName, el);
                }
            }
            else if (isSquareNode(el)) {
                const cn = el.className;
                if (squares.get(k) === cn)
                    sameSquares.add(k);
                else
                    appendValue(movedSquares, cn, el);
            }
            el = el.nextSibling;
        }
        // walk over all squares in current set, apply dom changes to moved squares
        // or append new squares
        for (const [sk, className] of squares) {
            if (!sameSquares.has(sk)) {
                sMvdset = movedSquares.get(className);
                sMvd = sMvdset && sMvdset.pop();
                const translation = posToTranslate$1(key2pos(sk), asWhite);
                if (sMvd) {
                    sMvd.cgKey = sk;
                    translate(sMvd, translation);
                }
                else {
                    const squareNode = createEl('square', className);
                    squareNode.cgKey = sk;
                    translate(squareNode, translation);
                    boardEl.insertBefore(squareNode, boardEl.firstChild);
                }
            }
        }
        // walk over all pieces in current set, apply dom changes to moved pieces
        // or append new pieces
        for (const [k, p] of pieces) {
            anim = anims.get(k);
            if (!samePieces.has(k)) {
                pMvdset = movedPieces.get(pieceNameOf(p));
                pMvd = pMvdset && pMvdset.pop();
                // a same piece was moved
                if (pMvd) {
                    // apply dom changes
                    pMvd.cgKey = k;
                    if (pMvd.cgFading) {
                        pMvd.classList.remove('fading');
                        pMvd.cgFading = false;
                    }
                    const pos = key2pos(k);
                    if (s.addPieceZIndex)
                        pMvd.style.zIndex = posZIndex(pos, asWhite);
                    if (anim) {
                        pMvd.cgAnimating = true;
                        pMvd.classList.add('anim');
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                    }
                    translate(pMvd, posToTranslate$1(pos, asWhite));
                }
                // no piece in moved obj: insert the new piece
                // assumes the new piece is not being dragged
                else {
                    const pieceName = pieceNameOf(p), pieceNode = createEl('piece', pieceName), pos = key2pos(k);
                    pieceNode.cgPiece = pieceName;
                    pieceNode.cgKey = k;
                    if (anim) {
                        pieceNode.cgAnimating = true;
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                    }
                    translate(pieceNode, posToTranslate$1(pos, asWhite));
                    if (s.addPieceZIndex)
                        pieceNode.style.zIndex = posZIndex(pos, asWhite);
                    boardEl.appendChild(pieceNode);
                }
            }
        }
        // remove any element that remains in the moved sets
        for (const nodes of movedPieces.values())
            removeNodes(s, nodes);
        for (const nodes of movedSquares.values())
            removeNodes(s, nodes);
    }
    function renderResized$1(s) {
        const asWhite = whitePov(s), posToTranslate$1 = posToTranslate(s.dom.bounds());
        let el = s.dom.elements.board.firstChild;
        while (el) {
            if ((isPieceNode(el) && !el.cgAnimating) || isSquareNode(el)) {
                translate(el, posToTranslate$1(key2pos(el.cgKey), asWhite));
            }
            el = el.nextSibling;
        }
    }
    function updateBounds(s) {
        var _a, _b;
        const bounds = s.dom.elements.wrap.getBoundingClientRect();
        const container = s.dom.elements.container;
        const ratio = bounds.height / bounds.width;
        const width = (Math.floor((bounds.width * window.devicePixelRatio) / 8) * 8) / window.devicePixelRatio;
        const height = width * ratio;
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        s.dom.bounds.clear();
        (_a = s.addDimensionsCssVarsTo) === null || _a === void 0 ? void 0 : _a.style.setProperty('--cg-width', width + 'px');
        (_b = s.addDimensionsCssVarsTo) === null || _b === void 0 ? void 0 : _b.style.setProperty('--cg-height', height + 'px');
    }
    const isPieceNode = (el) => el.tagName === 'PIECE';
    const isSquareNode = (el) => el.tagName === 'SQUARE';
    function removeNodes(s, nodes) {
        for (const node of nodes)
            s.dom.elements.board.removeChild(node);
    }
    function posZIndex(pos, asWhite) {
        const minZ = 3;
        const rank = pos[1];
        const z = asWhite ? minZ + 7 - rank : minZ + rank;
        return `${z}`;
    }
    const pieceNameOf = (piece) => `${piece.color} ${piece.role}`;
    function computeSquareClasses(s) {
        var _a;
        const squares = new Map();
        if (s.lastMove && s.highlight.lastMove)
            for (const k of s.lastMove) {
                addSquare(squares, k, 'last-move');
            }
        if (s.check && s.highlight.check)
            addSquare(squares, s.check, 'check');
        if (s.selected) {
            addSquare(squares, s.selected, 'selected');
            if (s.movable.showDests) {
                const dests = (_a = s.movable.dests) === null || _a === void 0 ? void 0 : _a.get(s.selected);
                if (dests)
                    for (const k of dests) {
                        addSquare(squares, k, 'move-dest' + (s.pieces.has(k) ? ' oc' : ''));
                    }
                const pDests = s.premovable.dests;
                if (pDests)
                    for (const k of pDests) {
                        addSquare(squares, k, 'premove-dest' + (s.pieces.has(k) ? ' oc' : ''));
                    }
            }
        }
        const premove = s.premovable.current;
        if (premove)
            for (const k of premove)
                addSquare(squares, k, 'current-premove');
        else if (s.predroppable.current)
            addSquare(squares, s.predroppable.current.key, 'current-premove');
        const o = s.exploding;
        if (o)
            for (const k of o.keys)
                addSquare(squares, k, 'exploding' + o.stage);
        return squares;
    }
    function addSquare(squares, key, klass) {
        const classes = squares.get(key);
        if (classes)
            squares.set(key, `${classes} ${klass}`);
        else
            squares.set(key, klass);
    }
    function appendValue(map, key, value) {
        const arr = map.get(key);
        if (arr)
            arr.push(value);
        else
            map.set(key, [value]);
    }

    function render(state, autoPieceEl) {
        const autoPieces = state.drawable.autoShapes.filter(autoShape => autoShape.piece);
        const autoPieceShapes = autoPieces.map((s) => {
            return {
                shape: s,
                hash: hash(s),
                current: false,
            };
        });
        syncShapes(autoPieceShapes, autoPieceEl, shape => renderShape(state, shape, state.dom.bounds()));
    }
    function renderResized(state) {
        var _a;
        const asWhite = whitePov(state), posToTranslate$1 = posToTranslate(state.dom.bounds());
        let el = (_a = state.dom.elements.autoPieces) === null || _a === void 0 ? void 0 : _a.firstChild;
        while (el) {
            translateAndScale(el, posToTranslate$1(key2pos(el.cgKey), asWhite), el.cgScale);
            el = el.nextSibling;
        }
    }
    function renderShape(state, { shape, hash }, bounds) {
        var _a, _b, _c;
        const orig = shape.orig;
        const role = (_a = shape.piece) === null || _a === void 0 ? void 0 : _a.role;
        const color = (_b = shape.piece) === null || _b === void 0 ? void 0 : _b.color;
        const scale = (_c = shape.piece) === null || _c === void 0 ? void 0 : _c.scale;
        const pieceEl = createEl('piece', `${role} ${color}`);
        pieceEl.setAttribute('cgHash', hash);
        pieceEl.cgKey = orig;
        pieceEl.cgScale = scale;
        translateAndScale(pieceEl, posToTranslate(bounds)(key2pos(orig), whitePov(state)), scale);
        return pieceEl;
    }
    const hash = (autoPiece) => { var _a, _b, _c; return [autoPiece.orig, (_a = autoPiece.piece) === null || _a === void 0 ? void 0 : _a.role, (_b = autoPiece.piece) === null || _b === void 0 ? void 0 : _b.color, (_c = autoPiece.piece) === null || _c === void 0 ? void 0 : _c.scale].join(','); };

    function Chessground(element, config) {
        const maybeState = defaults();
        configure(maybeState, config || {});
        function redrawAll() {
            const prevUnbind = 'dom' in maybeState ? maybeState.dom.unbind : undefined;
            // compute bounds from existing board element if possible
            // this allows non-square boards from CSS to be handled (for 3D)
            const elements = renderWrap(element, maybeState), bounds = memo(() => elements.board.getBoundingClientRect()), redrawNow = (skipSvg) => {
                render$1(state);
                if (elements.autoPieces)
                    render(state, elements.autoPieces);
                if (!skipSvg && elements.svg)
                    renderSvg(state, elements.svg, elements.customSvg);
            }, onResize = () => {
                updateBounds(state);
                renderResized$1(state);
                if (elements.autoPieces)
                    renderResized(state);
            };
            const state = maybeState;
            state.dom = {
                elements,
                bounds,
                redraw: debounceRedraw(redrawNow),
                redrawNow,
                unbind: prevUnbind,
            };
            state.drawable.prevSvgHash = '';
            updateBounds(state);
            redrawNow(false);
            bindBoard(state, onResize);
            if (!prevUnbind)
                state.dom.unbind = bindDocument(state, onResize);
            state.events.insert && state.events.insert(elements);
            return state;
        }
        return start(redrawAll(), redrawAll);
    }
    function debounceRedraw(redrawNow) {
        let redrawing = false;
        return () => {
            if (redrawing)
                return;
            redrawing = true;
            requestAnimationFrame(() => {
                redrawNow();
                redrawing = false;
            });
        };
    }

    /*
     * Copyright (c) 2022, Jeff Hlywa (jhlywa@gmail.com)
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice,
     *    this list of conditions and the following disclaimer.
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
     * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
     * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
     * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
     * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
     * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
     * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
     * POSSIBILITY OF SUCH DAMAGE.
     *
     *----------------------------------------------------------------------------*/

    const SYMBOLS = 'pnbrqkPNBRQK';

    const DEFAULT_POSITION =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    const TERMINATION_MARKERS = ['1-0', '0-1', '1/2-1/2', '*'];

    const PAWN_OFFSETS = {
      b: [16, 32, 17, 15],
      w: [-16, -32, -17, -15],
    };

    const PIECE_OFFSETS = {
      n: [-18, -33, -31, -14, 18, 33, 31, 14],
      b: [-17, -15, 17, 15],
      r: [-16, 1, 16, -1],
      q: [-17, -16, -15, 1, 17, 16, 15, -1],
      k: [-17, -16, -15, 1, 17, 16, 15, -1],
    };

    // prettier-ignore
    const ATTACKS = [
      20, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0,20, 0,
       0,20, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0,20, 0, 0,
       0, 0,20, 0, 0, 0, 0, 24,  0, 0, 0, 0,20, 0, 0, 0,
       0, 0, 0,20, 0, 0, 0, 24,  0, 0, 0,20, 0, 0, 0, 0,
       0, 0, 0, 0,20, 0, 0, 24,  0, 0,20, 0, 0, 0, 0, 0,
       0, 0, 0, 0, 0,20, 2, 24,  2,20, 0, 0, 0, 0, 0, 0,
       0, 0, 0, 0, 0, 2,53, 56, 53, 2, 0, 0, 0, 0, 0, 0,
      24,24,24,24,24,24,56,  0, 56,24,24,24,24,24,24, 0,
       0, 0, 0, 0, 0, 2,53, 56, 53, 2, 0, 0, 0, 0, 0, 0,
       0, 0, 0, 0, 0,20, 2, 24,  2,20, 0, 0, 0, 0, 0, 0,
       0, 0, 0, 0,20, 0, 0, 24,  0, 0,20, 0, 0, 0, 0, 0,
       0, 0, 0,20, 0, 0, 0, 24,  0, 0, 0,20, 0, 0, 0, 0,
       0, 0,20, 0, 0, 0, 0, 24,  0, 0, 0, 0,20, 0, 0, 0,
       0,20, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0,20, 0, 0,
      20, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0,20
    ];

    // prettier-ignore
    const RAYS = [
       17,  0,  0,  0,  0,  0,  0, 16,  0,  0,  0,  0,  0,  0, 15, 0,
        0, 17,  0,  0,  0,  0,  0, 16,  0,  0,  0,  0,  0, 15,  0, 0,
        0,  0, 17,  0,  0,  0,  0, 16,  0,  0,  0,  0, 15,  0,  0, 0,
        0,  0,  0, 17,  0,  0,  0, 16,  0,  0,  0, 15,  0,  0,  0, 0,
        0,  0,  0,  0, 17,  0,  0, 16,  0,  0, 15,  0,  0,  0,  0, 0,
        0,  0,  0,  0,  0, 17,  0, 16,  0, 15,  0,  0,  0,  0,  0, 0,
        0,  0,  0,  0,  0,  0, 17, 16, 15,  0,  0,  0,  0,  0,  0, 0,
        1,  1,  1,  1,  1,  1,  1,  0, -1, -1,  -1,-1, -1, -1, -1, 0,
        0,  0,  0,  0,  0,  0,-15,-16,-17,  0,  0,  0,  0,  0,  0, 0,
        0,  0,  0,  0,  0,-15,  0,-16,  0,-17,  0,  0,  0,  0,  0, 0,
        0,  0,  0,  0,-15,  0,  0,-16,  0,  0,-17,  0,  0,  0,  0, 0,
        0,  0,  0,-15,  0,  0,  0,-16,  0,  0,  0,-17,  0,  0,  0, 0,
        0,  0,-15,  0,  0,  0,  0,-16,  0,  0,  0,  0,-17,  0,  0, 0,
        0,-15,  0,  0,  0,  0,  0,-16,  0,  0,  0,  0,  0,-17,  0, 0,
      -15,  0,  0,  0,  0,  0,  0,-16,  0,  0,  0,  0,  0,  0,-17
    ];

    const SHIFTS = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 };

    const BITS = {
      NORMAL: 1,
      CAPTURE: 2,
      BIG_PAWN: 4,
      EP_CAPTURE: 8,
      PROMOTION: 16,
      KSIDE_CASTLE: 32,
      QSIDE_CASTLE: 64,
    };

    const RANK_1 = 7;
    const RANK_2 = 6;
    const RANK_7 = 1;
    const RANK_8 = 0;

    // prettier-ignore
    const SQUARE_MAP = {
      a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
      a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
      a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
      a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
      a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
      a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
      a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
      a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
    };

    const ROOKS = {
      w: [
        { square: SQUARE_MAP.a1, flag: BITS.QSIDE_CASTLE },
        { square: SQUARE_MAP.h1, flag: BITS.KSIDE_CASTLE },
      ],
      b: [
        { square: SQUARE_MAP.a8, flag: BITS.QSIDE_CASTLE },
        { square: SQUARE_MAP.h8, flag: BITS.KSIDE_CASTLE },
      ],
    };

    const PARSER_STRICT = 0;
    const PARSER_SLOPPY = 1;

    /* this function is used to uniquely identify ambiguous moves */
    function get_disambiguator(move, moves) {
      var from = move.from;
      var to = move.to;
      var piece = move.piece;

      var ambiguities = 0;
      var same_rank = 0;
      var same_file = 0;

      for (var i = 0, len = moves.length; i < len; i++) {
        var ambig_from = moves[i].from;
        var ambig_to = moves[i].to;
        var ambig_piece = moves[i].piece;

        /* if a move of the same piece type ends on the same to square, we'll
         * need to add a disambiguator to the algebraic notation
         */
        if (piece === ambig_piece && from !== ambig_from && to === ambig_to) {
          ambiguities++;

          if (rank(from) === rank(ambig_from)) {
            same_rank++;
          }

          if (file(from) === file(ambig_from)) {
            same_file++;
          }
        }
      }

      if (ambiguities > 0) {
        /* if there exists a similar moving piece on the same rank and file as
         * the move in question, use the square as the disambiguator
         */
        if (same_rank > 0 && same_file > 0) {
          return algebraic(from)
        } else if (same_file > 0) {
          /* if the moving piece rests on the same file, use the rank symbol as the
           * disambiguator
           */
          return algebraic(from).charAt(1)
        } else {
          /* else use the file symbol */
          return algebraic(from).charAt(0)
        }
      }

      return ''
    }

    function infer_piece_type(san) {
      var piece_type = san.charAt(0);
      if (piece_type >= 'a' && piece_type <= 'h') {
        var matches = san.match(/[a-h]\d.*[a-h]\d/);
        if (matches) {
          return undefined
        }
        return PAWN
      }
      piece_type = piece_type.toLowerCase();
      if (piece_type === 'o') {
        return KING
      }
      return piece_type
    }

    // parses all of the decorators out of a SAN string
    function stripped_san(move) {
      return move.replace(/=/, '').replace(/[+#]?[?!]*$/, '')
    }

    /*****************************************************************************
     * UTILITY FUNCTIONS
     ****************************************************************************/
    function rank(i) {
      return i >> 4
    }

    function file(i) {
      return i & 15
    }

    function algebraic(i) {
      var f = file(i),
        r = rank(i);
      return 'abcdefgh'.substring(f, f + 1) + '87654321'.substring(r, r + 1)
    }

    function swap_color(c) {
      return c === WHITE ? BLACK : WHITE
    }

    function is_digit(c) {
      return '0123456789'.indexOf(c) !== -1
    }

    function clone(obj) {
      var dupe = obj instanceof Array ? [] : {};

      for (var property in obj) {
        if (typeof property === 'object') {
          dupe[property] = clone(obj[property]);
        } else {
          dupe[property] = obj[property];
        }
      }

      return dupe
    }

    function trim(str) {
      return str.replace(/^\s+|\s+$/g, '')
    }

    /***************************************************************************
     * PUBLIC CONSTANTS
     **************************************************************************/

    const BLACK = 'b';
    const WHITE = 'w';

    const EMPTY = -1;

    const PAWN = 'p';
    const KNIGHT = 'n';
    const BISHOP = 'b';
    const ROOK = 'r';
    const QUEEN = 'q';
    const KING = 'k';

    const SQUARES = (function () {
      /* from the ECMA-262 spec (section 12.6.4):
       * "The mechanics of enumerating the properties ... is
       * implementation dependent"
       * so: for (var sq in SQUARES) { keys.push(sq); } might not be
       * ordered correctly
       */
      var keys = [];
      for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
        if (i & 0x88) {
          i += 7;
          continue
        }
        keys.push(algebraic(i));
      }
      return keys
    })();

    const FLAGS = {
      NORMAL: 'n',
      CAPTURE: 'c',
      BIG_PAWN: 'b',
      EP_CAPTURE: 'e',
      PROMOTION: 'p',
      KSIDE_CASTLE: 'k',
      QSIDE_CASTLE: 'q',
    };

    const Chess = function (fen) {
      var board = new Array(128);
      var kings = { w: EMPTY, b: EMPTY };
      var turn = WHITE;
      var castling = { w: 0, b: 0 };
      var ep_square = EMPTY;
      var half_moves = 0;
      var move_number = 1;
      var history = [];
      var header = {};
      var comments = {};

      /* if the user passes in a fen string, load it, else default to
       * starting position
       */
      if (typeof fen === 'undefined') {
        load(DEFAULT_POSITION);
      } else {
        load(fen);
      }

      function clear(keep_headers) {
        if (typeof keep_headers === 'undefined') {
          keep_headers = false;
        }

        board = new Array(128);
        kings = { w: EMPTY, b: EMPTY };
        turn = WHITE;
        castling = { w: 0, b: 0 };
        ep_square = EMPTY;
        half_moves = 0;
        move_number = 1;
        history = [];
        if (!keep_headers) header = {};
        comments = {};
        update_setup(generate_fen());
      }

      function prune_comments() {
        var reversed_history = [];
        var current_comments = {};
        var copy_comment = function (fen) {
          if (fen in comments) {
            current_comments[fen] = comments[fen];
          }
        };
        while (history.length > 0) {
          reversed_history.push(undo_move());
        }
        copy_comment(generate_fen());
        while (reversed_history.length > 0) {
          make_move(reversed_history.pop());
          copy_comment(generate_fen());
        }
        comments = current_comments;
      }

      function reset() {
        load(DEFAULT_POSITION);
      }

      function load(fen, keep_headers) {
        if (typeof keep_headers === 'undefined') {
          keep_headers = false;
        }

        var tokens = fen.split(/\s+/);
        var position = tokens[0];
        var square = 0;

        if (!validate_fen(fen).valid) {
          return false
        }

        clear(keep_headers);

        for (var i = 0; i < position.length; i++) {
          var piece = position.charAt(i);

          if (piece === '/') {
            square += 8;
          } else if (is_digit(piece)) {
            square += parseInt(piece, 10);
          } else {
            var color = piece < 'a' ? WHITE : BLACK;
            put({ type: piece.toLowerCase(), color: color }, algebraic(square));
            square++;
          }
        }

        turn = tokens[1];

        if (tokens[2].indexOf('K') > -1) {
          castling.w |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf('Q') > -1) {
          castling.w |= BITS.QSIDE_CASTLE;
        }
        if (tokens[2].indexOf('k') > -1) {
          castling.b |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf('q') > -1) {
          castling.b |= BITS.QSIDE_CASTLE;
        }

        ep_square = tokens[3] === '-' ? EMPTY : SQUARE_MAP[tokens[3]];
        half_moves = parseInt(tokens[4], 10);
        move_number = parseInt(tokens[5], 10);

        update_setup(generate_fen());

        return true
      }

      /* TODO: this function is pretty much crap - it validates structure but
       * completely ignores content (e.g. doesn't verify that each side has a king)
       * ... we should rewrite this, and ditch the silly error_number field while
       * we're at it
       */
      function validate_fen(fen) {
        var errors = {
          0: 'No errors.',
          1: 'FEN string must contain six space-delimited fields.',
          2: '6th field (move number) must be a positive integer.',
          3: '5th field (half move counter) must be a non-negative integer.',
          4: '4th field (en-passant square) is invalid.',
          5: '3rd field (castling availability) is invalid.',
          6: '2nd field (side to move) is invalid.',
          7: "1st field (piece positions) does not contain 8 '/'-delimited rows.",
          8: '1st field (piece positions) is invalid [consecutive numbers].',
          9: '1st field (piece positions) is invalid [invalid piece].',
          10: '1st field (piece positions) is invalid [row too large].',
          11: 'Illegal en-passant square',
        };

        /* 1st criterion: 6 space-seperated fields? */
        var tokens = fen.split(/\s+/);
        if (tokens.length !== 6) {
          return { valid: false, error_number: 1, error: errors[1] }
        }

        /* 2nd criterion: move number field is a integer value > 0? */
        if (isNaN(parseInt(tokens[5])) || parseInt(tokens[5], 10) <= 0) {
          return { valid: false, error_number: 2, error: errors[2] }
        }

        /* 3rd criterion: half move counter is an integer >= 0? */
        if (isNaN(parseInt(tokens[4])) || parseInt(tokens[4], 10) < 0) {
          return { valid: false, error_number: 3, error: errors[3] }
        }

        /* 4th criterion: 4th field is a valid e.p.-string? */
        if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
          return { valid: false, error_number: 4, error: errors[4] }
        }

        /* 5th criterion: 3th field is a valid castle-string? */
        if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) {
          return { valid: false, error_number: 5, error: errors[5] }
        }

        /* 6th criterion: 2nd field is "w" (white) or "b" (black)? */
        if (!/^(w|b)$/.test(tokens[1])) {
          return { valid: false, error_number: 6, error: errors[6] }
        }

        /* 7th criterion: 1st field contains 8 rows? */
        var rows = tokens[0].split('/');
        if (rows.length !== 8) {
          return { valid: false, error_number: 7, error: errors[7] }
        }

        /* 8th criterion: every row is valid? */
        for (var i = 0; i < rows.length; i++) {
          /* check for right sum of fields AND not two numbers in succession */
          var sum_fields = 0;
          var previous_was_number = false;

          for (var k = 0; k < rows[i].length; k++) {
            if (!isNaN(rows[i][k])) {
              if (previous_was_number) {
                return { valid: false, error_number: 8, error: errors[8] }
              }
              sum_fields += parseInt(rows[i][k], 10);
              previous_was_number = true;
            } else {
              if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
                return { valid: false, error_number: 9, error: errors[9] }
              }
              sum_fields += 1;
              previous_was_number = false;
            }
          }
          if (sum_fields !== 8) {
            return { valid: false, error_number: 10, error: errors[10] }
          }
        }

        if (
          (tokens[3][1] == '3' && tokens[1] == 'w') ||
          (tokens[3][1] == '6' && tokens[1] == 'b')
        ) {
          return { valid: false, error_number: 11, error: errors[11] }
        }

        /* everything's okay! */
        return { valid: true, error_number: 0, error: errors[0] }
      }

      function generate_fen() {
        var empty = 0;
        var fen = '';

        for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
          if (board[i] == null) {
            empty++;
          } else {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            var color = board[i].color;
            var piece = board[i].type;

            fen += color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
          }

          if ((i + 1) & 0x88) {
            if (empty > 0) {
              fen += empty;
            }

            if (i !== SQUARE_MAP.h1) {
              fen += '/';
            }

            empty = 0;
            i += 8;
          }
        }

        var cflags = '';
        if (castling[WHITE] & BITS.KSIDE_CASTLE) {
          cflags += 'K';
        }
        if (castling[WHITE] & BITS.QSIDE_CASTLE) {
          cflags += 'Q';
        }
        if (castling[BLACK] & BITS.KSIDE_CASTLE) {
          cflags += 'k';
        }
        if (castling[BLACK] & BITS.QSIDE_CASTLE) {
          cflags += 'q';
        }

        /* do we have an empty castling flag? */
        cflags = cflags || '-';
        var epflags = ep_square === EMPTY ? '-' : algebraic(ep_square);

        return [fen, turn, cflags, epflags, half_moves, move_number].join(' ')
      }

      function set_header(args) {
        for (var i = 0; i < args.length; i += 2) {
          if (typeof args[i] === 'string' && typeof args[i + 1] === 'string') {
            header[args[i]] = args[i + 1];
          }
        }
        return header
      }

      /* called when the initial board setup is changed with put() or remove().
       * modifies the SetUp and FEN properties of the header object.  if the FEN is
       * equal to the default position, the SetUp and FEN are deleted
       * the setup is only updated if history.length is zero, ie moves haven't been
       * made.
       */
      function update_setup(fen) {
        if (history.length > 0) return

        if (fen !== DEFAULT_POSITION) {
          header['SetUp'] = '1';
          header['FEN'] = fen;
        } else {
          delete header['SetUp'];
          delete header['FEN'];
        }
      }

      function get(square) {
        var piece = board[SQUARE_MAP[square]];
        return piece ? { type: piece.type, color: piece.color } : null
      }

      function put(piece, square) {
        /* check for valid piece object */
        if (!('type' in piece && 'color' in piece)) {
          return false
        }

        /* check for piece */
        if (SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) {
          return false
        }

        /* check for valid square */
        if (!(square in SQUARE_MAP)) {
          return false
        }

        var sq = SQUARE_MAP[square];

        /* don't let the user place more than one king */
        if (
          piece.type == KING &&
          !(kings[piece.color] == EMPTY || kings[piece.color] == sq)
        ) {
          return false
        }

        board[sq] = { type: piece.type, color: piece.color };
        if (piece.type === KING) {
          kings[piece.color] = sq;
        }

        update_setup(generate_fen());

        return true
      }

      function remove(square) {
        var piece = get(square);
        board[SQUARE_MAP[square]] = null;
        if (piece && piece.type === KING) {
          kings[piece.color] = EMPTY;
        }

        update_setup(generate_fen());

        return piece
      }

      function build_move(board, from, to, flags, promotion) {
        var move = {
          color: turn,
          from: from,
          to: to,
          flags: flags,
          piece: board[from].type,
        };

        if (promotion) {
          move.flags |= BITS.PROMOTION;
          move.promotion = promotion;
        }

        if (board[to]) {
          move.captured = board[to].type;
        } else if (flags & BITS.EP_CAPTURE) {
          move.captured = PAWN;
        }
        return move
      }

      function generate_moves(options) {
        function add_move(board, moves, from, to, flags) {
          /* if pawn promotion */
          if (
            board[from].type === PAWN &&
            (rank(to) === RANK_8 || rank(to) === RANK_1)
          ) {
            var pieces = [QUEEN, ROOK, BISHOP, KNIGHT];
            for (var i = 0, len = pieces.length; i < len; i++) {
              moves.push(build_move(board, from, to, flags, pieces[i]));
            }
          } else {
            moves.push(build_move(board, from, to, flags));
          }
        }

        var moves = [];
        var us = turn;
        var them = swap_color(us);
        var second_rank = { b: RANK_7, w: RANK_2 };

        var first_sq = SQUARE_MAP.a8;
        var last_sq = SQUARE_MAP.h1;
        var single_square = false;

        /* do we want legal moves? */
        var legal =
          typeof options !== 'undefined' && 'legal' in options
            ? options.legal
            : true;

        var piece_type =
          typeof options !== 'undefined' &&
          'piece' in options &&
          typeof options.piece === 'string'
            ? options.piece.toLowerCase()
            : true;

        /* are we generating moves for a single square? */
        if (typeof options !== 'undefined' && 'square' in options) {
          if (options.square in SQUARE_MAP) {
            first_sq = last_sq = SQUARE_MAP[options.square];
            single_square = true;
          } else {
            /* invalid square */
            return []
          }
        }

        for (var i = first_sq; i <= last_sq; i++) {
          /* did we run off the end of the board */
          if (i & 0x88) {
            i += 7;
            continue
          }

          var piece = board[i];
          if (piece == null || piece.color !== us) {
            continue
          }

          if (piece.type === PAWN && (piece_type === true || piece_type === PAWN)) {
            /* single square, non-capturing */
            var square = i + PAWN_OFFSETS[us][0];
            if (board[square] == null) {
              add_move(board, moves, i, square, BITS.NORMAL);

              /* double square */
              var square = i + PAWN_OFFSETS[us][1];
              if (second_rank[us] === rank(i) && board[square] == null) {
                add_move(board, moves, i, square, BITS.BIG_PAWN);
              }
            }

            /* pawn captures */
            for (j = 2; j < 4; j++) {
              var square = i + PAWN_OFFSETS[us][j];
              if (square & 0x88) continue

              if (board[square] != null && board[square].color === them) {
                add_move(board, moves, i, square, BITS.CAPTURE);
              } else if (square === ep_square) {
                add_move(board, moves, i, ep_square, BITS.EP_CAPTURE);
              }
            }
          } else if (piece_type === true || piece_type === piece.type) {
            for (var j = 0, len = PIECE_OFFSETS[piece.type].length; j < len; j++) {
              var offset = PIECE_OFFSETS[piece.type][j];
              var square = i;

              while (true) {
                square += offset;
                if (square & 0x88) break

                if (board[square] == null) {
                  add_move(board, moves, i, square, BITS.NORMAL);
                } else {
                  if (board[square].color === us) break
                  add_move(board, moves, i, square, BITS.CAPTURE);
                  break
                }

                /* break, if knight or king */
                if (piece.type === 'n' || piece.type === 'k') break
              }
            }
          }
        }

        /* check for castling if: a) we're generating all moves, or b) we're doing
         * single square move generation on the king's square
         */
        if (piece_type === true || piece_type === KING) {
          if (!single_square || last_sq === kings[us]) {
            /* king-side castling */
            if (castling[us] & BITS.KSIDE_CASTLE) {
              var castling_from = kings[us];
              var castling_to = castling_from + 2;

              if (
                board[castling_from + 1] == null &&
                board[castling_to] == null &&
                !attacked(them, kings[us]) &&
                !attacked(them, castling_from + 1) &&
                !attacked(them, castling_to)
              ) {
                add_move(board, moves, kings[us], castling_to, BITS.KSIDE_CASTLE);
              }
            }

            /* queen-side castling */
            if (castling[us] & BITS.QSIDE_CASTLE) {
              var castling_from = kings[us];
              var castling_to = castling_from - 2;

              if (
                board[castling_from - 1] == null &&
                board[castling_from - 2] == null &&
                board[castling_from - 3] == null &&
                !attacked(them, kings[us]) &&
                !attacked(them, castling_from - 1) &&
                !attacked(them, castling_to)
              ) {
                add_move(board, moves, kings[us], castling_to, BITS.QSIDE_CASTLE);
              }
            }
          }
        }

        /* return all pseudo-legal moves (this includes moves that allow the king
         * to be captured)
         */
        if (!legal) {
          return moves
        }

        /* filter out illegal moves */
        var legal_moves = [];
        for (var i = 0, len = moves.length; i < len; i++) {
          make_move(moves[i]);
          if (!king_attacked(us)) {
            legal_moves.push(moves[i]);
          }
          undo_move();
        }

        return legal_moves
      }

      /* convert a move from 0x88 coordinates to Standard Algebraic Notation
       * (SAN)
       *
       * @param {boolean} sloppy Use the sloppy SAN generator to work around over
       * disambiguation bugs in Fritz and Chessbase.  See below:
       *
       * r1bqkbnr/ppp2ppp/2n5/1B1pP3/4P3/8/PPPP2PP/RNBQK1NR b KQkq - 2 4
       * 4. ... Nge7 is overly disambiguated because the knight on c6 is pinned
       * 4. ... Ne7 is technically the valid SAN
       */
      function move_to_san(move, moves) {
        var output = '';

        if (move.flags & BITS.KSIDE_CASTLE) {
          output = 'O-O';
        } else if (move.flags & BITS.QSIDE_CASTLE) {
          output = 'O-O-O';
        } else {
          if (move.piece !== PAWN) {
            var disambiguator = get_disambiguator(move, moves);
            output += move.piece.toUpperCase() + disambiguator;
          }

          if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
            if (move.piece === PAWN) {
              output += algebraic(move.from)[0];
            }
            output += 'x';
          }

          output += algebraic(move.to);

          if (move.flags & BITS.PROMOTION) {
            output += '=' + move.promotion.toUpperCase();
          }
        }

        make_move(move);
        if (in_check()) {
          if (in_checkmate()) {
            output += '#';
          } else {
            output += '+';
          }
        }
        undo_move();

        return output
      }

      function attacked(color, square) {
        for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
          /* did we run off the end of the board */
          if (i & 0x88) {
            i += 7;
            continue
          }

          /* if empty square or wrong color */
          if (board[i] == null || board[i].color !== color) continue

          var piece = board[i];
          var difference = i - square;
          var index = difference + 119;

          if (ATTACKS[index] & (1 << SHIFTS[piece.type])) {
            if (piece.type === PAWN) {
              if (difference > 0) {
                if (piece.color === WHITE) return true
              } else {
                if (piece.color === BLACK) return true
              }
              continue
            }

            /* if the piece is a knight or a king */
            if (piece.type === 'n' || piece.type === 'k') return true

            var offset = RAYS[index];
            var j = i + offset;

            var blocked = false;
            while (j !== square) {
              if (board[j] != null) {
                blocked = true;
                break
              }
              j += offset;
            }

            if (!blocked) return true
          }
        }

        return false
      }

      function king_attacked(color) {
        return attacked(swap_color(color), kings[color])
      }

      function in_check() {
        return king_attacked(turn)
      }

      function in_checkmate() {
        return in_check() && generate_moves().length === 0
      }

      function in_stalemate() {
        return !in_check() && generate_moves().length === 0
      }

      function insufficient_material() {
        var pieces = {};
        var bishops = [];
        var num_pieces = 0;
        var sq_color = 0;

        for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
          sq_color = (sq_color + 1) % 2;
          if (i & 0x88) {
            i += 7;
            continue
          }

          var piece = board[i];
          if (piece) {
            pieces[piece.type] = piece.type in pieces ? pieces[piece.type] + 1 : 1;
            if (piece.type === BISHOP) {
              bishops.push(sq_color);
            }
            num_pieces++;
          }
        }

        /* k vs. k */
        if (num_pieces === 2) {
          return true
        } else if (
          /* k vs. kn .... or .... k vs. kb */
          num_pieces === 3 &&
          (pieces[BISHOP] === 1 || pieces[KNIGHT] === 1)
        ) {
          return true
        } else if (num_pieces === pieces[BISHOP] + 2) {
          /* kb vs. kb where any number of bishops are all on the same color */
          var sum = 0;
          var len = bishops.length;
          for (var i = 0; i < len; i++) {
            sum += bishops[i];
          }
          if (sum === 0 || sum === len) {
            return true
          }
        }

        return false
      }

      function in_threefold_repetition() {
        /* TODO: while this function is fine for casual use, a better
         * implementation would use a Zobrist key (instead of FEN). the
         * Zobrist key would be maintained in the make_move/undo_move functions,
         * avoiding the costly that we do below.
         */
        var moves = [];
        var positions = {};
        var repetition = false;

        while (true) {
          var move = undo_move();
          if (!move) break
          moves.push(move);
        }

        while (true) {
          /* remove the last two fields in the FEN string, they're not needed
           * when checking for draw by rep */
          var fen = generate_fen().split(' ').slice(0, 4).join(' ');

          /* has the position occurred three or move times */
          positions[fen] = fen in positions ? positions[fen] + 1 : 1;
          if (positions[fen] >= 3) {
            repetition = true;
          }

          if (!moves.length) {
            break
          }
          make_move(moves.pop());
        }

        return repetition
      }

      function push(move) {
        history.push({
          move: move,
          kings: { b: kings.b, w: kings.w },
          turn: turn,
          castling: { b: castling.b, w: castling.w },
          ep_square: ep_square,
          half_moves: half_moves,
          move_number: move_number,
        });
      }

      function make_move(move) {
        var us = turn;
        var them = swap_color(us);
        push(move);

        board[move.to] = board[move.from];
        board[move.from] = null;

        /* if ep capture, remove the captured pawn */
        if (move.flags & BITS.EP_CAPTURE) {
          if (turn === BLACK) {
            board[move.to - 16] = null;
          } else {
            board[move.to + 16] = null;
          }
        }

        /* if pawn promotion, replace with new piece */
        if (move.flags & BITS.PROMOTION) {
          board[move.to] = { type: move.promotion, color: us };
        }

        /* if we moved the king */
        if (board[move.to].type === KING) {
          kings[board[move.to].color] = move.to;

          /* if we castled, move the rook next to the king */
          if (move.flags & BITS.KSIDE_CASTLE) {
            var castling_to = move.to - 1;
            var castling_from = move.to + 1;
            board[castling_to] = board[castling_from];
            board[castling_from] = null;
          } else if (move.flags & BITS.QSIDE_CASTLE) {
            var castling_to = move.to + 1;
            var castling_from = move.to - 2;
            board[castling_to] = board[castling_from];
            board[castling_from] = null;
          }

          /* turn off castling */
          castling[us] = '';
        }

        /* turn off castling if we move a rook */
        if (castling[us]) {
          for (var i = 0, len = ROOKS[us].length; i < len; i++) {
            if (
              move.from === ROOKS[us][i].square &&
              castling[us] & ROOKS[us][i].flag
            ) {
              castling[us] ^= ROOKS[us][i].flag;
              break
            }
          }
        }

        /* turn off castling if we capture a rook */
        if (castling[them]) {
          for (var i = 0, len = ROOKS[them].length; i < len; i++) {
            if (
              move.to === ROOKS[them][i].square &&
              castling[them] & ROOKS[them][i].flag
            ) {
              castling[them] ^= ROOKS[them][i].flag;
              break
            }
          }
        }

        /* if big pawn move, update the en passant square */
        if (move.flags & BITS.BIG_PAWN) {
          if (turn === 'b') {
            ep_square = move.to - 16;
          } else {
            ep_square = move.to + 16;
          }
        } else {
          ep_square = EMPTY;
        }

        /* reset the 50 move counter if a pawn is moved or a piece is captured */
        if (move.piece === PAWN) {
          half_moves = 0;
        } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
          half_moves = 0;
        } else {
          half_moves++;
        }

        if (turn === BLACK) {
          move_number++;
        }
        turn = swap_color(turn);
      }

      function undo_move() {
        var old = history.pop();
        if (old == null) {
          return null
        }

        var move = old.move;
        kings = old.kings;
        turn = old.turn;
        castling = old.castling;
        ep_square = old.ep_square;
        half_moves = old.half_moves;
        move_number = old.move_number;

        var us = turn;
        var them = swap_color(turn);

        board[move.from] = board[move.to];
        board[move.from].type = move.piece; // to undo any promotions
        board[move.to] = null;

        if (move.flags & BITS.CAPTURE) {
          board[move.to] = { type: move.captured, color: them };
        } else if (move.flags & BITS.EP_CAPTURE) {
          var index;
          if (us === BLACK) {
            index = move.to - 16;
          } else {
            index = move.to + 16;
          }
          board[index] = { type: PAWN, color: them };
        }

        if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
          var castling_to, castling_from;
          if (move.flags & BITS.KSIDE_CASTLE) {
            castling_to = move.to + 1;
            castling_from = move.to - 1;
          } else if (move.flags & BITS.QSIDE_CASTLE) {
            castling_to = move.to - 2;
            castling_from = move.to + 1;
          }

          board[castling_to] = board[castling_from];
          board[castling_from] = null;
        }

        return move
      }

      // convert a move from Standard Algebraic Notation (SAN) to 0x88 coordinates
      function move_from_san(move, sloppy) {
        // strip off any move decorations: e.g Nf3+?! becomes Nf3
        var clean_move = stripped_san(move);

        // the move parsers is a 2-step state
        for (var parser = 0; parser < 2; parser++) {
          if (parser == PARSER_SLOPPY) {
            // only run the sloppy parse if explicitly requested
            if (!sloppy) {
              return null
            }

            // The sloppy parser allows the user to parse non-standard chess
            // notations. This parser is opt-in (by specifying the
            // '{ sloppy: true }' setting) and is only run after the Standard
            // Algebraic Notation (SAN) parser has failed.
            //
            // When running the sloppy parser, we'll run a regex to grab the piece,
            // the to/from square, and an optional promotion piece. This regex will
            // parse common non-standard notation like: Pe2-e4, Rc1c4, Qf3xf7,
            // f7f8q, b1c3

            // NOTE: Some positions and moves may be ambiguous when using the
            // sloppy parser. For example, in this position:
            // 6k1/8/8/B7/8/8/8/BN4K1 w - - 0 1, the move b1c3 may be interpreted
            // as Nc3 or B1c3 (a disambiguated bishop move). In these cases, the
            // sloppy parser will default to the most most basic interpretation
            // (which is b1c3 parsing to Nc3).

            // FIXME: these var's are hoisted into function scope, this will need
            // to change when switching to const/let

            var overly_disambiguated = false;

            var matches = clean_move.match(
              /([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/
            );
            if (matches) {
              var piece = matches[1];
              var from = matches[2];
              var to = matches[3];
              var promotion = matches[4];

              if (from.length == 1) {
                overly_disambiguated = true;
              }
            } else {
              // The [a-h]?[1-8]? portion of the regex below handles moves that may
              // be overly disambiguated (e.g. Nge7 is unnecessary and non-standard
              // when there is one legal knight move to e7). In this case, the value
              // of 'from' variable will be a rank or file, not a square.
              var matches = clean_move.match(
                /([pnbrqkPNBRQK])?([a-h]?[1-8]?)x?-?([a-h][1-8])([qrbnQRBN])?/
              );

              if (matches) {
                var piece = matches[1];
                var from = matches[2];
                var to = matches[3];
                var promotion = matches[4];

                if (from.length == 1) {
                  var overly_disambiguated = true;
                }
              }
            }
          }

          var piece_type = infer_piece_type(clean_move);
          var moves = generate_moves({
            legal: true,
            piece: piece ? piece : piece_type,
          });

          for (var i = 0, len = moves.length; i < len; i++) {
            switch (parser) {
              case PARSER_STRICT: {
                if (clean_move === stripped_san(move_to_san(moves[i], moves))) {
                  return moves[i]
                }
                break
              }
              case PARSER_SLOPPY: {
                if (matches) {
                  // hand-compare move properties with the results from our sloppy
                  // regex
                  if (
                    (!piece || piece.toLowerCase() == moves[i].piece) &&
                    SQUARE_MAP[from] == moves[i].from &&
                    SQUARE_MAP[to] == moves[i].to &&
                    (!promotion || promotion.toLowerCase() == moves[i].promotion)
                  ) {
                    return moves[i]
                  } else if (overly_disambiguated) {
                    // SPECIAL CASE: we parsed a move string that may have an
                    // unneeded rank/file disambiguator (e.g. Nge7).  The 'from'
                    // variable will
                    var square = algebraic(moves[i].from);
                    if (
                      (!piece || piece.toLowerCase() == moves[i].piece) &&
                      SQUARE_MAP[to] == moves[i].to &&
                      (from == square[0] || from == square[1]) &&
                      (!promotion || promotion.toLowerCase() == moves[i].promotion)
                    ) {
                      return moves[i]
                    }
                  }
                }
              }
            }
          }
        }

        return null
      }

      /* pretty = external move object */
      function make_pretty(ugly_move) {
        var move = clone(ugly_move);
        move.san = move_to_san(move, generate_moves({ legal: true }));
        move.to = algebraic(move.to);
        move.from = algebraic(move.from);

        var flags = '';

        for (var flag in BITS) {
          if (BITS[flag] & move.flags) {
            flags += FLAGS[flag];
          }
        }
        move.flags = flags;

        return move
      }

      /*****************************************************************************
       * DEBUGGING UTILITIES
       ****************************************************************************/
      function perft(depth) {
        var moves = generate_moves({ legal: false });
        var nodes = 0;
        var color = turn;

        for (var i = 0, len = moves.length; i < len; i++) {
          make_move(moves[i]);
          if (!king_attacked(color)) {
            if (depth - 1 > 0) {
              var child_nodes = perft(depth - 1);
              nodes += child_nodes;
            } else {
              nodes++;
            }
          }
          undo_move();
        }

        return nodes
      }

      return {
        /***************************************************************************
         * PUBLIC API
         **************************************************************************/
        load: function (fen) {
          return load(fen)
        },

        reset: function () {
          return reset()
        },

        moves: function (options) {
          /* The internal representation of a chess move is in 0x88 format, and
           * not meant to be human-readable.  The code below converts the 0x88
           * square coordinates to algebraic coordinates.  It also prunes an
           * unnecessary move keys resulting from a verbose call.
           */

          var ugly_moves = generate_moves(options);
          var moves = [];

          for (var i = 0, len = ugly_moves.length; i < len; i++) {
            /* does the user want a full move object (most likely not), or just
             * SAN
             */
            if (
              typeof options !== 'undefined' &&
              'verbose' in options &&
              options.verbose
            ) {
              moves.push(make_pretty(ugly_moves[i]));
            } else {
              moves.push(
                move_to_san(ugly_moves[i], generate_moves({ legal: true }))
              );
            }
          }

          return moves
        },

        in_check: function () {
          return in_check()
        },

        in_checkmate: function () {
          return in_checkmate()
        },

        in_stalemate: function () {
          return in_stalemate()
        },

        in_draw: function () {
          return (
            half_moves >= 100 ||
            in_stalemate() ||
            insufficient_material() ||
            in_threefold_repetition()
          )
        },

        insufficient_material: function () {
          return insufficient_material()
        },

        in_threefold_repetition: function () {
          return in_threefold_repetition()
        },

        game_over: function () {
          return (
            half_moves >= 100 ||
            in_checkmate() ||
            in_stalemate() ||
            insufficient_material() ||
            in_threefold_repetition()
          )
        },

        validate_fen: function (fen) {
          return validate_fen(fen)
        },

        fen: function () {
          return generate_fen()
        },

        board: function () {
          var output = [],
            row = [];

          for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
            if (board[i] == null) {
              row.push(null);
            } else {
              row.push({
                square: algebraic(i),
                type: board[i].type,
                color: board[i].color,
              });
            }
            if ((i + 1) & 0x88) {
              output.push(row);
              row = [];
              i += 8;
            }
          }

          return output
        },

        pgn: function (options) {
          /* using the specification from http://www.chessclub.com/help/PGN-spec
           * example for html usage: .pgn({ max_width: 72, newline_char: "<br />" })
           */
          var newline =
            typeof options === 'object' && typeof options.newline_char === 'string'
              ? options.newline_char
              : '\n';
          var max_width =
            typeof options === 'object' && typeof options.max_width === 'number'
              ? options.max_width
              : 0;
          var result = [];
          var header_exists = false;

          /* add the PGN header information */
          for (var i in header) {
            /* TODO: order of enumerated properties in header object is not
             * guaranteed, see ECMA-262 spec (section 12.6.4)
             */
            result.push('[' + i + ' "' + header[i] + '"]' + newline);
            header_exists = true;
          }

          if (header_exists && history.length) {
            result.push(newline);
          }

          var append_comment = function (move_string) {
            var comment = comments[generate_fen()];
            if (typeof comment !== 'undefined') {
              var delimiter = move_string.length > 0 ? ' ' : '';
              move_string = `${move_string}${delimiter}{${comment}}`;
            }
            return move_string
          };

          /* pop all of history onto reversed_history */
          var reversed_history = [];
          while (history.length > 0) {
            reversed_history.push(undo_move());
          }

          var moves = [];
          var move_string = '';

          /* special case of a commented starting position with no moves */
          if (reversed_history.length === 0) {
            moves.push(append_comment(''));
          }

          /* build the list of moves.  a move_string looks like: "3. e3 e6" */
          while (reversed_history.length > 0) {
            move_string = append_comment(move_string);
            var move = reversed_history.pop();

            /* if the position started with black to move, start PGN with #. ... */
            if (!history.length && move.color === 'b') {
              const prefix = `${move_number}. ...`;
              /* is there a comment preceding the first move? */
              move_string = move_string ? `${move_string} ${prefix}` : prefix;
            } else if (move.color === 'w') {
              /* store the previous generated move_string if we have one */
              if (move_string.length) {
                moves.push(move_string);
              }
              move_string = move_number + '.';
            }

            move_string =
              move_string + ' ' + move_to_san(move, generate_moves({ legal: true }));
            make_move(move);
          }

          /* are there any other leftover moves? */
          if (move_string.length) {
            moves.push(append_comment(move_string));
          }

          /* is there a result? */
          if (typeof header.Result !== 'undefined') {
            moves.push(header.Result);
          }

          /* history should be back to what it was before we started generating PGN,
           * so join together moves
           */
          if (max_width === 0) {
            return result.join('') + moves.join(' ')
          }

          var strip = function () {
            if (result.length > 0 && result[result.length - 1] === ' ') {
              result.pop();
              return true
            }
            return false
          };

          /* NB: this does not preserve comment whitespace. */
          var wrap_comment = function (width, move) {
            for (var token of move.split(' ')) {
              if (!token) {
                continue
              }
              if (width + token.length > max_width) {
                while (strip()) {
                  width--;
                }
                result.push(newline);
                width = 0;
              }
              result.push(token);
              width += token.length;
              result.push(' ');
              width++;
            }
            if (strip()) {
              width--;
            }
            return width
          };

          /* wrap the PGN output at max_width */
          var current_width = 0;
          for (var i = 0; i < moves.length; i++) {
            if (current_width + moves[i].length > max_width) {
              if (moves[i].includes('{')) {
                current_width = wrap_comment(current_width, moves[i]);
                continue
              }
            }
            /* if the current move will push past max_width */
            if (current_width + moves[i].length > max_width && i !== 0) {
              /* don't end the line with whitespace */
              if (result[result.length - 1] === ' ') {
                result.pop();
              }

              result.push(newline);
              current_width = 0;
            } else if (i !== 0) {
              result.push(' ');
              current_width++;
            }
            result.push(moves[i]);
            current_width += moves[i].length;
          }

          return result.join('')
        },

        load_pgn: function (pgn, options) {
          // allow the user to specify the sloppy move parser to work around over
          // disambiguation bugs in Fritz and Chessbase
          var sloppy =
            typeof options !== 'undefined' && 'sloppy' in options
              ? options.sloppy
              : false;

          function mask(str) {
            return str.replace(/\\/g, '\\')
          }

          function parse_pgn_header(header, options) {
            var newline_char =
              typeof options === 'object' &&
              typeof options.newline_char === 'string'
                ? options.newline_char
                : '\r?\n';
            var header_obj = {};
            var headers = header.split(new RegExp(mask(newline_char)));
            var key = '';
            var value = '';

            for (var i = 0; i < headers.length; i++) {
              var regex = /^\s*\[([A-Za-z]+)\s*"(.*)"\s*\]\s*$/;
              key = headers[i].replace(regex, '$1');
              value = headers[i].replace(regex, '$2');
              if (trim(key).length > 0) {
                header_obj[key] = value;
              }
            }

            return header_obj
          }

          // strip whitespace from head/tail of PGN block
          pgn = pgn.trim();

          var newline_char =
            typeof options === 'object' && typeof options.newline_char === 'string'
              ? options.newline_char
              : '\r?\n';

          // RegExp to split header. Takes advantage of the fact that header and movetext
          // will always have a blank line between them (ie, two newline_char's).
          // With default newline_char, will equal: /^(\[((?:\r?\n)|.)*\])(?:\s*\r?\n){2}/
          var header_regex = new RegExp(
            '^(\\[((?:' +
              mask(newline_char) +
              ')|.)*\\])' +
              '(?:\\s*' +
              mask(newline_char) +
              '){2}'
          );

          // If no header given, begin with moves.
          var header_string = header_regex.test(pgn)
            ? header_regex.exec(pgn)[1]
            : '';

          // Put the board in the starting position
          reset();

          /* parse PGN header */
          var headers = parse_pgn_header(header_string, options);
          var fen = '';

          for (var key in headers) {
            // check to see user is including fen (possibly with wrong tag case)
            if (key.toLowerCase() === 'fen') {
              fen = headers[key];
            }
            set_header([key, headers[key]]);
          }

          /* sloppy parser should attempt to load a fen tag, even if it's
           * the wrong case and doesn't include a corresponding [SetUp "1"] tag */
          if (sloppy) {
            if (fen) {
              if (!load(fen, true)) {
                return false
              }
            }
          } else {
            /* strict parser - load the starting position indicated by [Setup '1']
             * and [FEN position] */
            if (headers['SetUp'] === '1') {
              if (!('FEN' in headers && load(headers['FEN'], true))) {
                // second argument to load: don't clear the headers
                return false
              }
            }
          }

          /* NB: the regexes below that delete move numbers, recursive
           * annotations, and numeric annotation glyphs may also match
           * text in comments. To prevent this, we transform comments
           * by hex-encoding them in place and decoding them again after
           * the other tokens have been deleted.
           *
           * While the spec states that PGN files should be ASCII encoded,
           * we use {en,de}codeURIComponent here to support arbitrary UTF8
           * as a convenience for modern users */

          var to_hex = function (string) {
            return Array.from(string)
              .map(function (c) {
                /* encodeURI doesn't transform most ASCII characters,
                 * so we handle these ourselves */
                return c.charCodeAt(0) < 128
                  ? c.charCodeAt(0).toString(16)
                  : encodeURIComponent(c).replace(/\%/g, '').toLowerCase()
              })
              .join('')
          };

          var from_hex = function (string) {
            return string.length == 0
              ? ''
              : decodeURIComponent('%' + string.match(/.{1,2}/g).join('%'))
          };

          var encode_comment = function (string) {
            string = string.replace(new RegExp(mask(newline_char), 'g'), ' ');
            return `{${to_hex(string.slice(1, string.length - 1))}}`
          };

          var decode_comment = function (string) {
            if (string.startsWith('{') && string.endsWith('}')) {
              return from_hex(string.slice(1, string.length - 1))
            }
          };

          /* delete header to get the moves */
          var ms = pgn
            .replace(header_string, '')
            .replace(
              /* encode comments so they don't get deleted below */
              new RegExp(`(\{[^}]*\})+?|;([^${mask(newline_char)}]*)`, 'g'),
              function (match, bracket, semicolon) {
                return bracket !== undefined
                  ? encode_comment(bracket)
                  : ' ' + encode_comment(`{${semicolon.slice(1)}}`)
              }
            )
            .replace(new RegExp(mask(newline_char), 'g'), ' ');

          /* delete recursive annotation variations */
          var rav_regex = /(\([^\(\)]+\))+?/g;
          while (rav_regex.test(ms)) {
            ms = ms.replace(rav_regex, '');
          }

          /* delete move numbers */
          ms = ms.replace(/\d+\.(\.\.)?/g, '');

          /* delete ... indicating black to move */
          ms = ms.replace(/\.\.\./g, '');

          /* delete numeric annotation glyphs */
          ms = ms.replace(/\$\d+/g, '');

          /* trim and get array of moves */
          var moves = trim(ms).split(new RegExp(/\s+/));

          /* delete empty entries */
          moves = moves.join(',').replace(/,,+/g, ',').split(',');
          var move = '';

          var result = '';

          for (var half_move = 0; half_move < moves.length; half_move++) {
            var comment = decode_comment(moves[half_move]);
            if (comment !== undefined) {
              comments[generate_fen()] = comment;
              continue
            }

            move = move_from_san(moves[half_move], sloppy);

            /* invalid move */
            if (move == null) {
              /* was the move an end of game marker */
              if (TERMINATION_MARKERS.indexOf(moves[half_move]) > -1) {
                result = moves[half_move];
              } else {
                return false
              }
            } else {
              /* reset the end of game marker if making a valid move */
              result = '';
              make_move(move);
            }
          }

          /* Per section 8.2.6 of the PGN spec, the Result tag pair must match
           * match the termination marker. Only do this when headers are present,
           * but the result tag is missing
           */
          if (result && Object.keys(header).length && !header['Result']) {
            set_header(['Result', result]);
          }

          return true
        },

        header: function () {
          return set_header(arguments)
        },

        turn: function () {
          return turn
        },

        move: function (move, options) {
          /* The move function can be called with in the following parameters:
           *
           * .move('Nxb7')      <- where 'move' is a case-sensitive SAN string
           *
           * .move({ from: 'h7', <- where the 'move' is a move object (additional
           *         to :'h8',      fields are ignored)
           *         promotion: 'q',
           *      })
           */

          // allow the user to specify the sloppy move parser to work around over
          // disambiguation bugs in Fritz and Chessbase
          var sloppy =
            typeof options !== 'undefined' && 'sloppy' in options
              ? options.sloppy
              : false;

          var move_obj = null;

          if (typeof move === 'string') {
            move_obj = move_from_san(move, sloppy);
          } else if (typeof move === 'object') {
            var moves = generate_moves();

            /* convert the pretty move object to an ugly move object */
            for (var i = 0, len = moves.length; i < len; i++) {
              if (
                move.from === algebraic(moves[i].from) &&
                move.to === algebraic(moves[i].to) &&
                (!('promotion' in moves[i]) ||
                  move.promotion === moves[i].promotion)
              ) {
                move_obj = moves[i];
                break
              }
            }
          }

          /* failed to find move */
          if (!move_obj) {
            return null
          }

          /* need to make a copy of move because we can't generate SAN after the
           * move is made
           */
          var pretty_move = make_pretty(move_obj);

          make_move(move_obj);

          return pretty_move
        },

        undo: function () {
          var move = undo_move();
          return move ? make_pretty(move) : null
        },

        clear: function () {
          return clear()
        },

        put: function (piece, square) {
          return put(piece, square)
        },

        get: function (square) {
          return get(square)
        },

        ascii() {
          var s = '   +------------------------+\n';
          for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
            /* display the rank */
            if (file(i) === 0) {
              s += ' ' + '87654321'[rank(i)] + ' |';
            }

            /* empty piece */
            if (board[i] == null) {
              s += ' . ';
            } else {
              var piece = board[i].type;
              var color = board[i].color;
              var symbol =
                color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
              s += ' ' + symbol + ' ';
            }

            if ((i + 1) & 0x88) {
              s += '|\n';
              i += 8;
            }
          }
          s += '   +------------------------+\n';
          s += '     a  b  c  d  e  f  g  h';

          return s
        },

        remove: function (square) {
          return remove(square)
        },

        perft: function (depth) {
          return perft(depth)
        },

        square_color: function (square) {
          if (square in SQUARE_MAP) {
            var sq_0x88 = SQUARE_MAP[square];
            return (rank(sq_0x88) + file(sq_0x88)) % 2 === 0 ? 'light' : 'dark'
          }

          return null
        },

        history: function (options) {
          var reversed_history = [];
          var move_history = [];
          var verbose =
            typeof options !== 'undefined' &&
            'verbose' in options &&
            options.verbose;

          while (history.length > 0) {
            reversed_history.push(undo_move());
          }

          while (reversed_history.length > 0) {
            var move = reversed_history.pop();
            if (verbose) {
              move_history.push(make_pretty(move));
            } else {
              move_history.push(move_to_san(move, generate_moves({ legal: true })));
            }
            make_move(move);
          }

          return move_history
        },

        get_comment: function () {
          return comments[generate_fen()]
        },

        set_comment: function (comment) {
          comments[generate_fen()] = comment.replace('{', '[').replace('}', ']');
        },

        delete_comment: function () {
          var comment = comments[generate_fen()];
          delete comments[generate_fen()];
          return comment
        },

        get_comments: function () {
          prune_comments();
          return Object.keys(comments).map(function (fen) {
            return { fen: fen, comment: comments[fen] }
          })
        },

        delete_comments: function () {
          prune_comments();
          return Object.keys(comments).map(function (fen) {
            var comment = comments[fen];
            delete comments[fen];
            return { fen: fen, comment: comment }
          })
        },
      }
    };

    function toDests(chess) {
        const dests = new Map();
        SQUARES.forEach(s => {
            const ms = chess.moves({ square: s, verbose: true });
            if (ms.length)
                dests.set(s, ms.map(m => m.to));
        });
        return dests;
    }
    function toColor(chess) {
        return (chess.turn() === 'w') ? 'white' : 'black';
    }
    function playOtherSide(cg, chess) {
        return (orig, dest) => {
            chess.move({ from: orig, to: dest });
            cg.set({
                turnColor: toColor(chess),
                movable: {
                    color: toColor(chess),
                    dests: toDests(chess)
                }
            });
            console.log(chess.fen());
        };
    }

    const chess = new Chess();
    const el = document.getElementById('chessground-examples');
    const cg = Chessground(el, {
        movable: {
            color: 'white',
            free: false,
            dests: toDests(chess),
        },
        draggable: {
            showGhost: true
        }
    });
    cg.set({
        movable: { events: { after: playOtherSide(cg, chess) } }
    });

})();
