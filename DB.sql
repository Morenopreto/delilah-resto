CREATE DATABASE delilahResto;
USE delilahResto;
CREATE TABLE usuarios(
    usuario_id int PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombrecompleto varchar(30) NOT NULL,
    mail varchar(30) NOT NULL UNIQUE,
    direccion varchar(50) NOT NULL,
    administrador int(2) NOT NULL,
    telefono int NOT NULL,
    usuario varchar(30) NOT NULL,
    contrasena varchar(30) NOT NULL

);
CREATE TABLE productos(
    producto_id int PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombre_producto varchar(30) NOT NULL,
    descripcion varchar(50) NOT NULL,
    precio numeric NOT NULL,
    Img_url varchar(2048) NOT NULL,
    active int(2) NOT NULL
);
CREATE TABLE pedidos(
    order_id int PRIMARY KEY AUTO_INCREMENT NOT NULL,
    -- precio_total numeric NOT NULL,
    metodo_pago varchar(30) NOT NULL,
    direccion varchar(50) NOT NULL,
    usuario_id int NOT NULL
);
CREATE TABLE productos_pedidos( 
    order_id INT NOT NULL,
    producto_id int,
    quantity int NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id),
    FOREIGN KEY (order_id)  REFERENCES pedidos(order_id)
     
);


CREATE TABLE estados( 
    estado_id int PRIMARY KEY AUTO_INCREMENT NOT NULL,
    estado_pedido varchar(10) NOT NULL
);

CREATE TABLE estado_pedidos( 
    order_id int,
    estado_id int,
    FOREIGN KEY (order_id)  REFERENCES productos_pedidos(order_id),
    FOREIGN KEY (estado_id) REFERENCES estados(estado_id) 

);
INSERT INTO `usuarios` (nombrecompleto, mail, direccion,telefono,usuario,contrasena,administrador) VALUES ('Administrador', 'admin@live.com', 'av. Siempre viva 123',1512345678,'admin','admin', 1);

INSERT INTO `estados` (estado_pedido) VALUES ('nuevo');
INSERT INTO `estados` (estado_pedido) VALUES ('confirmado');
INSERT INTO `estados` (estado_pedido) VALUES ('preparando');
INSERT INTO `estados` (estado_pedido) VALUES ('enviado');
INSERT INTO `estados` (estado_pedido) VALUES ('entregado');

-- CREACION DE PRODUCTOS PARA PRUEBA DE ENDOPOINTS
INSERT INTO `productos` (nombre_producto, descripcion, precio ,Img_url,active) VALUES ('Chesseburger', 'hamburguesa simple con cheddar', 250 ,'https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F9%2F2019%2F09%2FCheeseburger-Cheeseburger-Deals-FT-Blog0919.jpg', 1);
INSERT INTO `productos` (nombre_producto, descripcion, precio ,Img_url,active) VALUES ('Doble Chesseburger', 'hamburguesa doble con cheddar', 350 ,'https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F9%2F2019%2F09%2FCheeseburger-Cheeseburger-Deals-FT-Blog0919.jpg', 1);
INSERT INTO `productos` (nombre_producto, descripcion, precio ,Img_url,active) VALUES ('Ensalada', 'Ensalada pollo grille, repollo, lechuga y tomate  ', 350 ,'https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F9%2F2019%2F09%2FCheeseburger-Cheeseburger-Deals-FT-Blog0919.jpg', 1);


