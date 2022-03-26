import snake_case from './snake_case';

describe('snake_case', () => {
  it('should convert strings to snake_case', () => {
    expect(snake_case('hello world')).toEqual('hello_world');
    expect(snake_case('hello-world')).toEqual('hello_world');
    expect(snake_case('hell0 9world')).toEqual('hell0_9world');
    expect(snake_case('hello--world')).toEqual('hello__world');
    expect(snake_case('hello(world')).toEqual('hello_world');
    expect(snake_case('hello(world')).toEqual('hello_world');
    expect(snake_case('hello*world')).toEqual('hello_world');
    expect(snake_case('hello*world again')).toEqual('hello_world_again');
    expect(snake_case('hello.world.again')).toEqual('hello_world_again');
    expect(snake_case('h e l l o')).toEqual('h_e_l_l_o');
    expect(snake_case('HELLO WORLD')).toEqual('hello_world');
    expect(snake_case('HELLO-WORLD')).toEqual('hello_world');
  });
});
