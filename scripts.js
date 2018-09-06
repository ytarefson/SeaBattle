// 1 корабль — ряд из 4 клеток («четырёхпалубный»; линкор)
// 2 корабля — ряд из 3 клеток («трёхпалубные»; крейсера)
// 3 корабля — ряд из 2 клеток («двухпалубные»; эсминцы)
// 4 корабля — 1 клетка («однопалубные»; торпедные катера)

$(function() {
  $('#restart-button').on('click', function() {
    location.reload();
  });
  if (getCookie('userName') === null) {
    var userName = prompt('Добрый день, Адмирал! Как тебя зовут?', name);
    setCookie('userName', userName);
    $('.admiral').text(getCookie('userName'));
  } else {
    $('.admiral').text(getCookie('userName'));
  }
  $('#cookie-reset').on('click', function() {
    deleteCookie('userName');
    location.reload();
  });
  // Функции работы с куки
  // Создать куки
  function setCookie(name, value) {
    return (document.cookie = name + '=' + value);
  }
  // Получить куки
  function getCookie(name) {
    var cookie = ' ' + document.cookie;
    var search = ' ' + name + '=';
    var setStr = null;
    var offset = 0;
    var end = 0;
    if (cookie.length > 0) {
      offset = cookie.indexOf(search);
      if (offset != -1) {
        offset += search.length;
        end = cookie.indexOf(';', offset);
        if (end == -1) {
          end = cookie.length;
        }
        setStr = unescape(cookie.substring(offset, end));
      }
    }
    return setStr;
  }
  // Удалить куки
  function deleteCookie(name) {
    var cookieDate = new Date();
    cookieDate.setTime(cookieDate.getTime() - 1);
    var cookie = (name += '=; expires=' + cookieDate.toGMTString());
    document.cookie = cookie;
  }
  var Game = {
    gameOver: false,
    turn: false,
    winner: '',
    enemy: {
      ships: {},
      userField: [],
      lastStrike: '', // Хотел использовать эти две переменные для реализации логики
      firstLuckyHit: '', // стрельбы компьютера по раненым кораблям.
      getField: function() {
        var list = $('#user-field .row .firePoint');
        var array = [];
        for (i = 0; i < list.length; i++) {
          array.push(list[i].className);
        }
        return (Game.enemy.userField = array);
      },
      strike: function(field) {
        // Так стреляет компьютер.
        var Dot = [];
        var item = field[Math.floor(Math.random() * field.length)];
        // Получаем значения координат
        var result = item.match(/point-\d+-\d+/gm);
        var dots = result[0].split('-');
        Dot = [dots[1], dots[2]];
        //Записываем класс ячейки по которой выстрелели
        var exactDot = 'point-' + Dot[0] + '-' + Dot[1];
        // Проходим массив с ячейками и находим элемент
        for (i = 0; i < Game.enemy.userField.length; i++) {
          if (
            Game.enemy.userField[i].match(/point-\d+-\d+/gm)[0] === exactDot
          ) {
            var boatPoint = Dot[0] + '-' + Dot[1];
            var cell = '#user-field .' + exactDot;
            // Вырезаем из массива с полями ячейку по которой выстрелили
            Game.enemy.userField.splice(i, 1);
            // Провереяем мы попали в корабль или мимо
            if ($(cell).hasClass('ship')) {
              $(cell).removeClass('ship');
              $(cell).addClass('shot-hit');
              // Попали - мы ранили корабль или убили?
              for (var key in Game.user.ships) {
                if (Game.user.ships.hasOwnProperty(key)) {
                  var element = Game.user.ships[key];
                  for (j = 0; j < element.boatArray.length; j++) {
                    if (element.boatArray[j] == boatPoint) {
                      if (element.boatArray.length == 1) {
                        // Если длина лодки 1 - значит убили.
                        // Удаляем из массива с необстрелянными полями окружающие точки

                        for (i = 0; i < element.nearPoints.length; i++) {
                          var classOfPoint = 'point-' + element.nearPoints[i];
                          for (x = 0; x < Game.enemy.userField.length; x++) {
                            if (
                              Game.enemy.userField[x].match(
                                /point-\d+-\d+/gm
                              )[0] === classOfPoint
                            ) {
                              Game.enemy.userField.splice(x, 1);
                            }
                          }
                        }
                        this.firstLuckyHit = '';
                        Game.turn = true;
                      }
                      // Если длина лодки больше 1 - значит ранили, следующий выстрел должен быть 1 из 4
                      else {
                        this.firstLuckyHit = Dot;
                        Game.turn = true;
                      }
                    }
                  }
                }
              }
              // Мимо - ставим класс - Мимо
              // И передаем ход игроку
              this.firstLuckyHit = Dot;
            } else {
              $(cell).addClass('shot-miss');

              Game.turn = false;
            }
          }
        }
        return Game.turn;
      }
    },
    user: {
      ships: {}
    },
    // Генерация поля
    generateFields: function(fieldName) {
      var alpabetArray = ['A', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'];
      for (i = 0; i < 11; i++) {
        $('<div class="row row-' + i + '">').appendTo(fieldName);
        for (j = 0; j < 11; j++) {
          if (i == 0 && j !== 0) {
            $('<div class="coordinate-name">' + j + '</div>').appendTo(
              fieldName + ' .row-' + i
            );
          } else if (i == 0 && j == 0) {
            $('<div class="spread"></div>').appendTo(fieldName + ' .row-' + i);
          } else if (j == 0) {
            $(
              '<div class="coordinate-name">' + alpabetArray[i - 1] + '</div>'
            ).appendTo(fieldName + ' .row-' + i);
          } else {
            $(
              '<div class="cell firePoint point-' + i + '-' + j + '"></div>'
            ).appendTo(fieldName + ' .row-' + i);
          }
        }
      }
    },

    // Далее идут функции установки кораблей на поле
    // Они очень однотипны и должны быть унифицированны в одну,
    // которая принимает длину корабля
    // - это первый момент который я не успел сделать
    setLinkor: function(fieldName) {
      var player = '';
      if (fieldName == 'enemy-field') {
        player = 'enemy';
      } else {
        player = 'user';
      }
      var boatArray = [];
      var shipVektor = Math.floor(Math.random() * 2);
      if (shipVektor == 1) {
        var X = Math.floor(Math.random() * 10) + 1;
        var Y = Math.floor(Math.random() * 7) + 1;

        var checkResults = Game.fieldCheck(3, 6, X, Y, fieldName);

        var flag = checkResults[0];
        var nearPoints = checkResults[1];
        if (flag) {
          for (i = 0; i < 4; i++) {
            Game.landShipHorizontal(X, Y, i, fieldName, boatArray);
          }
        } else {
          Game.setLinkor(fieldName);
        }
      } else {
        var X = Math.floor(Math.random() * 7) + 1;
        var Y = Math.floor(Math.random() * 10) + 1;
        var checkResults = Game.fieldCheck(6, 3, X, Y, fieldName);

        var flag = checkResults[0];
        var nearPoints = checkResults[1];
        if (flag) {
          for (i = 0; i < 4; i++) {
            Game.landShipVertical(X, Y, i, fieldName, boatArray);
          }
        } else {
          Game.setLinkor(fieldName);
        }
      }
      if (boatArray.length > 0) {
        var boatName = 'linkor' + X + Y;
        var boat = {
          boatArray: boatArray,
          nearPoints: nearPoints
        };
        return (Game[player].ships[boatName] = boat);
      }
    },
    setCruisers: function(fieldName) {
      var player = '';
      if (fieldName == 'enemy-field') {
        player = 'enemy';
      } else {
        player = 'user';
      }
      var boatArray = [];
      var shipVektor = Math.floor(Math.random() * 2);
      if (shipVektor == 1) {
        var X = Math.floor(Math.random() * 10) + 1;
        var Y = Math.floor(Math.random() * 8) + 1;
        var checkResults = Game.fieldCheck(3, 5, X, Y, fieldName);

        var flag = checkResults[0];
        var nearPoints = checkResults[1];
        if (flag) {
          for (i = 0; i < 3; i++) {
            Game.landShipHorizontal(X, Y, i, fieldName, boatArray);
          }
        } else {
          Game.setCruisers(fieldName);
        }
      } else {
        var X = Math.floor(Math.random() * 8) + 1;
        var Y = Math.floor(Math.random() * 10) + 1;
        var checkResults = Game.fieldCheck(5, 3, X, Y, fieldName);

        var flag = checkResults[0];
        var nearPoints = checkResults[1];
        if (flag) {
          for (i = 0; i < 3; i++) {
            Game.landShipVertical(X, Y, i, fieldName, boatArray);
          }
        } else {
          Game.setCruisers(fieldName);
        }
      }
      if (boatArray.length > 0) {
        var boatName = 'cruiser' + X + Y;
        var boat = {
          boatArray: boatArray,
          nearPoints: nearPoints
        };
        return (Game[player].ships[boatName] = boat);
      }
    },
    setDestroyers: function(fieldName) {
      var player = '';
      if (fieldName == 'enemy-field') {
        player = 'enemy';
      } else {
        player = 'user';
      }
      var boatArray = [];
      var shipVektor = Math.floor(Math.random() * 2);
      if (shipVektor == 1) {
        var X = Math.floor(Math.random() * 10) + 1;
        var Y = Math.floor(Math.random() * 9) + 1;
        var checkResults = Game.fieldCheck(3, 4, X, Y, fieldName);

        var flag = checkResults[0];
        var nearPoints = checkResults[1];
        if (flag) {
          for (i = 0; i < 2; i++) {
            Game.landShipHorizontal(X, Y, i, fieldName, boatArray);
          }
        } else {
          Game.setDestroyers(fieldName);
        }
      } else {
        var X = Math.floor(Math.random() * 9) + 1;
        var Y = Math.floor(Math.random() * 10) + 1;
        var checkResults = Game.fieldCheck(4, 3, X, Y, fieldName);

        var flag = checkResults[0];
        var nearPoints = checkResults[1];
        if (flag) {
          for (i = 0; i < 2; i++) {
            Game.landShipVertical(X, Y, i, fieldName, boatArray);
          }
        } else {
          Game.setDestroyers(fieldName);
        }
      }
      if (boatArray.length > 0) {
        var boatName = 'destroyer' + X + Y;
        var boat = {
          boatArray: boatArray,
          nearPoints: nearPoints
        };
        return (Game[player].ships[boatName] = boat);
      }
    },
    setBoats: function(fieldName) {
      var player = '';
      if (fieldName == 'enemy-field') {
        player = 'enemy';
      } else {
        player = 'user';
      }
      // fieldName = Player
      var X = Math.floor(Math.random() * 10) + 1;
      var Y = Math.floor(Math.random() * 10) + 1;

      var boatArray = [];
      var checkResults = Game.fieldCheck(3, 3, X, Y, fieldName);

      var flag = checkResults[0];
      var nearPoints = checkResults[1];
      if (flag) {
        for (i = 0; i < 1; i++) {
          Game.landShipVertical(X, Y, i, fieldName, boatArray);
        }
      } else {
        Game.setBoats(fieldName);
      }
      if (boatArray.length > 0) {
        var boatName = 'boat' + X + Y;
        var boat = {
          boatArray: boatArray,
          nearPoints: nearPoints
        };

        return (Game[player].ships[boatName] = boat);
      }
    },
    // Функция получает точку и размер корабля, проверяем можно ли там разместить корабль
    // Если можно то возвращаем массив с точками
    // И записываем его как окружение корабля.
    // В дальнейшем компьютер понимает, что если корабль убит, то в эти точки можно не стрелять
    fieldCheck: function(
      HorizontStartPoint,
      VerticalStartPoint,
      X,
      Y,
      fieldName
    ) {
      var sectorClear = true;
      var nearPoints = [];
      for (i = 0; i < HorizontStartPoint; i++) {
        for (j = 0; j < VerticalStartPoint; j++) {
          var checkPointX = X - 1 + i;
          var checkPointY = Y - 1 + j;
          if (
            checkPointX > 0 &&
            checkPointX < 11 &&
            checkPointY > 0 &&
            checkPointY < 11
          ) {
            nearPoints.push(checkPointX + '-' + checkPointY);
          }
          var cell = $(
            '#' + fieldName + ' .point-' + checkPointX + '-' + checkPointY
          );
          if (cell.hasClass('ship')) {
            sectorClear = false;
          }
        }
      }
      if (sectorClear) {
        return [sectorClear, nearPoints];
      } else return sectorClear;
    },
    // Ставим корабль по горизонтали
    landShipHorizontal: function(X, Y, i, fieldName, boatArray) {
      var pointY = Y + i;
      var field = $('#' + fieldName + ' .point-' + X + '-' + pointY + '');
      $(field).addClass('ship');
      var coordinate = X + '-' + pointY;
      boatArray.push(coordinate);
      return boatArray;
    },
    // Ставим корабль по вертикали
    landShipVertical: function(X, Y, i, fieldName, boatArray) {
      var pointX = X + i;
      var field = $('#' + fieldName + ' .point-' + pointX + '-' + Y + '');
      $(field).addClass('ship');
      var coordinate = pointX + '-' + Y;
      boatArray.push(coordinate);
      return boatArray;
    }
  };
  // Генерируем поле для игроков
  Game.generateFields('#user-field');
  Game.generateFields('#enemy-field');
  // Ставим лодки для врага
  Game.setLinkor('enemy-field');
  Game.setCruisers('enemy-field');
  Game.setCruisers('enemy-field');
  Game.setBoats('enemy-field');
  Game.setBoats('enemy-field');
  Game.setBoats('enemy-field');
  Game.setBoats('enemy-field');
  Game.setDestroyers('enemy-field');
  Game.setDestroyers('enemy-field');
  Game.setDestroyers('enemy-field');
  // Ставим лодки для игрока
  Game.setLinkor('user-field');
  Game.setCruisers('user-field');
  Game.setCruisers('user-field');
  Game.setBoats('user-field');
  Game.setBoats('user-field');
  Game.setBoats('user-field');
  Game.setBoats('user-field');
  Game.setDestroyers('user-field');
  Game.setDestroyers('user-field');
  Game.setDestroyers('user-field');

  Game.enemy.getField();

  $('#enemy-field .firePoint').on('click', function(e) {
    if (!Game.turn && !Game.gameOver) {
      // После выстрела по ячейки убираем с нее класс и event listener
      $(e.target).removeClass('firePoint');
      $(e.target).off();
      var myClass = $(e.currentTarget).attr('class');
      var matchShip = myClass.match(/ship/gm);
      // Получаем координаты ячейки и записываем
      var result = myClass.match(/point-\d+-\d+/gm);
      var dots = result[0].split('-');
      var Dot = [dots[1], dots[2]];
      // boatPoint - для сравнения с массивом с кораблями
      var boatPoint = Dot[0] + '-' + Dot[1];
      var flag = matchShip;

      if (flag !== null && flag[0] === 'ship') {
        $(e.target).addClass('shot-hit');
        $(e.target).removeClass('ship');

        // Убили или ранили?
        // Проверяем есть ли такие координаты у какого-нибудь корабля противника
        for (var key in Game.enemy.ships) {
          if (Game.enemy.ships.hasOwnProperty(key)) {
            var element = Game.enemy.ships[key];
            for (j = 0; j < element.boatArray.length; j++) {
              if (element.boatArray[j] == boatPoint) {
                if (element.boatArray.length == 1) {
                  // УБИЛИ! - выбрасываем сообщение на экран
                  $('.strike-kill').fadeIn(function() {
                    setTimeout(function() {
                      $('.strike-kill').fadeOut();
                    }, 1000);
                  });
                } else if (element.boatArray.length > 1) {
                  // РАНИЛИ! - выбрасываем сообщение на экран
                  $('.strike-hit').fadeIn(function() {
                    setTimeout(function() {
                      $('.strike-hit').fadeOut();
                    }, 1000);
                  });
                }

                // Уменьшаем длину корабля
                element.boatArray.splice(j, 1);
              }
            }
          }
        }
        // Проверяем все корабли убили
        var shipCount = $('#enemy-field .ship').length;
        if (shipCount == 0) {
          // Да - объявляем победителя
          Game.winner = getCookie('userName');
          Game.gameOver = true;
        }
        // Нет - передаем ход
        Game.turn = false;
      } else {
        // МИМО! - выбрасываем сообщение на экран
        $('.strike-miss').fadeIn(function() {
          setTimeout(function() {
            $('.strike-miss').fadeOut();
          }, 1000);
        });
        $(e.target).addClass('shot-miss');
        // Передаем ход и противник стреляет пока ход не передасться
        Game.turn = true;
        while (Game.turn && !Game.gameOver) {
          Game.enemy.strike(Game.enemy.userField);
          // Проверяем все корабли убили
          var shipCount = $('#user-field .ship').length;
          if (shipCount == 0) {
            // Да - победил противник
            Game.winner = 'Компьютер';
            Game.gameOver = true;
          }
        }
      }
    } else {
      // Передаем ход и противник стреляет пока ход не передасться
      Game.turn = true;
      while (Game.turn && !Game.gameOver) {
        Game.enemy.strike(Game.enemy.userField);
        // Проверяем все корабли убили
        var shipCount = $('#user-field .ship').length;
        if (shipCount == 0) {
          // Да - победил противник
          Game.winner = 'Компьютер';
          Game.gameOver = true;
        }
      }
    }
    // Окончание игры и перезапуск страницы
    if (Game.gameOver) {
      alert('Игра окончена. ' + Game.winner + ' победил');
      location.reload();
    }
  });
});
